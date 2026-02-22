import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withPermission } from "@/lib/middleware";
import { updateMemberPermissionsSchema } from "@/lib/validations";
import {
  parseRequestBody,
  handlePrismaError,
  logAudit,
} from "@/lib/api-helpers";
import { userSelectMin } from "@/lib/queries/user-queries";
import { ProjectMemberRole } from "@prisma/client";

interface Params {
  params: { projectId: string; memberId: string };
}

// PATCH /api/projects/[projectId]/members/[memberId] - Atualiza membro do projeto
export async function PATCH(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canManageMembers", async (req: NextRequest, { user }) => {
      try {
        const { projectId, memberId } = params;

        // Parse and validate body
        const bodyResult = await parseRequestBody(req, updateMemberPermissionsSchema);
        if ("error" in bodyResult) return bodyResult.error;

        const data = bodyResult.data;

        // Check if member exists
        const member = await prisma.projectMember.findFirst({
          where: {
            id: memberId,
            projectId,
            isActive: true,
          },
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        });

        if (!member) {
          return NextResponse.json(
            { success: false, message: "Membro não encontrado" },
            { status: 404 }
          );
        }

        // Prevent changing own role (to avoid locking yourself out)
        if (member.userId === user.id && data.role && data.role !== member.role) {
          return NextResponse.json(
            {
              success: false,
              message: "Você não pode alterar seu próprio perfil no projeto",
            },
            { status: 400 }
          );
        }

        // Check if trying to change manager
        if (member.role === "MANAGER" && data.role && data.role !== "MANAGER") {
          // Check if there's another manager
          const otherManagers = await prisma.projectMember.count({
            where: {
              projectId,
              role: "MANAGER",
              isActive: true,
              id: { not: memberId },
            },
          });

          if (otherManagers === 0) {
            return NextResponse.json(
              {
                success: false,
                message: "O projeto precisa ter pelo menos um gerente",
              },
              { status: 400 }
            );
          }
        }

        // Update member
        const updatedMember = await prisma.projectMember.update({
          where: { id: memberId },
          data: {
            ...(data.role && { role: data.role }),
            ...(data.customPermissions && { customPermissions: data.customPermissions }),
          },
          include: {
            user: {
              select: userSelectMin,
            },
          },
        });

        // Log audit
        await logAudit({
          action: "MEMBER_UPDATE",
          userId: user.id,
          targetType: "PROJECT_MEMBER",
          targetId: memberId,
          metadata: {
            projectId,
            userId: member.userId,
            updatedFields: Object.keys(data),
          },
        });

        return NextResponse.json(
          {
            success: true,
            data: updatedMember,
            message: "Membro atualizado com sucesso",
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("[PROJECT_MEMBER_PATCH]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}

// DELETE /api/projects/[projectId]/members/[memberId] - Remove membro do projeto
export async function DELETE(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canManageMembers", async (req: NextRequest, { user }) => {
      try {
        const { projectId, memberId } = params;

        // Check if member exists
        const member = await prisma.projectMember.findFirst({
          where: {
            id: memberId,
            projectId,
            isActive: true,
          },
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        });

        if (!member) {
          return NextResponse.json(
            { success: false, message: "Membro não encontrado" },
            { status: 404 }
          );
        }

        // Prevent self-removal (to avoid locking yourself out)
        if (member.userId === user.id) {
          return NextResponse.json(
            {
              success: false,
              message: "Você não pode remover a si mesmo do projeto",
            },
            { status: 400 }
          );
        }

        // Check if trying to remove manager
        if (member.role === "MANAGER") {
          // Check if there's another manager
          const otherManagers = await prisma.projectMember.count({
            where: {
              projectId,
              role: "MANAGER",
              isActive: true,
              id: { not: memberId },
            },
          });

          if (otherManagers === 0) {
            return NextResponse.json(
              {
                success: false,
                message: "Não é possível remover o único gerente do projeto",
              },
              { status: 400 }
            );
          }
        }

        // Soft delete - deactivate member
        await prisma.projectMember.update({
          where: { id: memberId },
          data: { isActive: false },
        });

        // Unassign all tasks from this member
        await prisma.taskAssignee.deleteMany({
          where: {
            userId: member.userId,
            task: {
              projectId,
            },
          },
        });

        // Log audit
        await logAudit({
          action: "MEMBER_REMOVE",
          userId: user.id,
          targetType: "PROJECT_MEMBER",
          targetId: memberId,
          metadata: {
            projectId,
            userId: member.userId,
            userEmail: member.user.email,
          },
        });

        return NextResponse.json(
          {
            success: true,
            message: "Membro removido com sucesso",
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("[PROJECT_MEMBER_DELETE]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}
