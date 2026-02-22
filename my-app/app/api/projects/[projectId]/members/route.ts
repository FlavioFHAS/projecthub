import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withPermission } from "@/lib/middleware";
import { projectMemberSchema } from "@/lib/validations";
import {
  parseRequestBody,
  handlePrismaError,
  logAudit,
  verifyProjectAccess,
} from "@/lib/api-helpers";
import { userSelectMin } from "@/lib/queries/user-queries";
import { ProjectMemberRole } from "@prisma/client";

interface Params {
  params: { projectId: string };
}

// GET /api/projects/[projectId]/members - Lista membros do projeto
export async function GET(req: NextRequest, { params }: Params) {
  return withAuth(async (req: NextRequest, { user }) => {
    try {
      const { projectId } = params;

      // Check permissions
      const hasAccess = await verifyProjectAccess(projectId, user.id, user.role);
      if (!hasAccess) {
        return NextResponse.json(
          {
            success: false,
            message: "Você não tem permissão para visualizar este projeto",
          },
          { status: 403 }
        );
      }

      const members = await prisma.projectMember.findMany({
        where: {
          projectId,
          isActive: true,
        },
        include: {
          user: {
            select: {
              ...userSelectMin,
              phone: true,
              isActive: true,
              lastLoginAt: true,
            },
          },
        },
        orderBy: [{ role: "asc" }, { createdAt: "desc" }],
      });

      return NextResponse.json(
        { success: true, data: members },
        { status: 200 }
      );
    } catch (error) {
      console.error("[PROJECT_MEMBERS_GET]", error);
      return handlePrismaError(error);
    }
  })(req);
}

// POST /api/projects/[projectId]/members - Adiciona membro ao projeto
export async function POST(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canManageMembers", async (req: NextRequest, { user }) => {
      try {
        const { projectId } = params;

        // Parse and validate body
        const bodyResult = await parseRequestBody(req, projectMemberSchema);
        if ("error" in bodyResult) return bodyResult.error;

        const data = bodyResult.data;

        // Verify project exists
        const project = await prisma.project.findUnique({
          where: { id: projectId, isActive: true },
          select: { id: true, name: true },
        });

        if (!project) {
          return NextResponse.json(
            { success: false, message: "Projeto não encontrado" },
            { status: 404 }
          );
        }

        // Verify user exists and is active
        const targetUser = await prisma.user.findUnique({
          where: { id: data.userId, isActive: true },
          select: { id: true, name: true, email: true },
        });

        if (!targetUser) {
          return NextResponse.json(
            {
              success: false,
              message: "Usuário não encontrado",
              errors: { userId: ["Usuário não existe ou está inativo"] },
            },
            { status: 404 }
          );
        }

        // Check if user is already a member
        const existingMember = await prisma.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId,
              userId: data.userId,
            },
          },
        });

        if (existingMember) {
          if (existingMember.isActive) {
            return NextResponse.json(
              {
                success: false,
                message: "Usuário já é membro deste projeto",
              },
              { status: 409 }
            );
          } else {
            // Reactivate member
            const updatedMember = await prisma.projectMember.update({
              where: {
                projectId_userId: {
                  projectId,
                  userId: data.userId,
                },
              },
              data: {
                isActive: true,
                role: data.role,
                customPermissions: data.customPermissions || {},
              },
              include: {
                user: {
                  select: userSelectMin,
                },
              },
            });

            // Log audit
            await logAudit({
              action: "MEMBER_REACTIVATE",
              userId: user.id,
              targetType: "PROJECT_MEMBER",
              targetId: updatedMember.id,
              metadata: {
                projectId,
                userId: data.userId,
                role: data.role,
              },
            });

            return NextResponse.json(
              {
                success: true,
                data: updatedMember,
                message: "Membro reativado com sucesso",
              },
              { status: 200 }
            );
          }
        }

        // Create new member
        const newMember = await prisma.projectMember.create({
          data: {
            projectId,
            userId: data.userId,
            role: data.role,
            customPermissions: data.customPermissions || {},
            isActive: true,
          },
          include: {
            user: {
              select: userSelectMin,
            },
          },
        });

        // Log audit
        await logAudit({
          action: "MEMBER_ADD",
          userId: user.id,
          targetType: "PROJECT_MEMBER",
          targetId: newMember.id,
          metadata: {
            projectId,
            userId: data.userId,
            userEmail: targetUser.email,
            role: data.role,
          },
        });

        return NextResponse.json(
          {
            success: true,
            data: newMember,
            message: "Membro adicionado com sucesso",
          },
          { status: 201 }
        );
      } catch (error) {
        console.error("[PROJECT_MEMBERS_POST]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}
