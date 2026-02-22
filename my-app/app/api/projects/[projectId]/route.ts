import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withPermission } from "@/lib/middleware";
import { updateProjectSchema } from "@/lib/validations";
import {
  parseRequestBody,
  handlePrismaError,
  logAudit,
  verifyProjectAccess,
  calculateProgress,
} from "@/lib/api-helpers";
import { userSelectMin } from "@/lib/queries/user-queries";

interface Params {
  params: { projectId: string };
}

// GET /api/projects/[projectId] - Obtém detalhes de um projeto
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

      const project = await prisma.project.findUnique({
        where: { id: projectId, isActive: true },
        include: {
          client: {
            select: { id: true, name: true, logo: true, email: true },
          },
          manager: {
            select: userSelectMin,
          },
          members: {
            where: { isActive: true },
            include: {
              user: {
                select: userSelectMin,
              },
            },
          },
          sections: {
            where: { isActive: true },
            orderBy: { order: "asc" },
          },
          kanbanColumns: {
            where: { isActive: true },
            orderBy: { order: "asc" },
          },
          _count: {
            select: {
              tasks: true,
              meetings: true,
              proposals: true,
            },
          },
        },
      });

      if (!project) {
        return NextResponse.json(
          { success: false, message: "Projeto não encontrado" },
          { status: 404 }
        );
      }

      // Calculate progress
      const progress = await calculateProgress(projectId);

      return NextResponse.json(
        {
          success: true,
          data: {
            ...project,
            progress,
          },
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("[PROJECT_GET]", error);
      return handlePrismaError(error);
    }
  })(req);
}

// PATCH /api/projects/[projectId] - Atualiza um projeto
export async function PATCH(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canEditProject", async (req: NextRequest, { user }) => {
      try {
        const { projectId } = params;

        // Parse and validate body
        const bodyResult = await parseRequestBody(req, updateProjectSchema);
        if ("error" in bodyResult) return bodyResult.error;

        const data = bodyResult.data;

        // Check if project exists
        const existingProject = await prisma.project.findUnique({
          where: { id: projectId, isActive: true },
          select: { id: true, clientId: true, managerId: true },
        });

        if (!existingProject) {
          return NextResponse.json(
            { success: false, message: "Projeto não encontrado" },
            { status: 404 }
          );
        }

        // Verify new client if changing
        if (data.clientId && data.clientId !== existingProject.clientId) {
          const client = await prisma.client.findUnique({
            where: { id: data.clientId, isActive: true },
          });

          if (!client) {
            return NextResponse.json(
              {
                success: false,
                message: "Cliente não encontrado",
                errors: { clientId: ["Cliente não existe ou está inativo"] },
              },
              { status: 404 }
            );
          }
        }

        // Verify new manager if changing
        if (data.managerId && data.managerId !== existingProject.managerId) {
          const manager = await prisma.user.findUnique({
            where: { id: data.managerId, isActive: true },
          });

          if (!manager) {
            return NextResponse.json(
              {
                success: false,
                message: "Gerente não encontrado",
                errors: { managerId: ["Gerente não existe ou está inativo"] },
              },
              { status: 404 }
            );
          }

          // Update project member roles
          await prisma.$transaction([
            // Remove old manager from members (or change role)
            prisma.projectMember.updateMany({
              where: {
                projectId,
                userId: existingProject.managerId,
                role: "MANAGER",
              },
              data: { role: "MEMBER" },
            }),
            // Add or update new manager
            prisma.projectMember.upsert({
              where: {
                projectId_userId: {
                  projectId,
                  userId: data.managerId,
                },
              },
              create: {
                projectId,
                userId: data.managerId,
                role: "MANAGER",
                isActive: true,
              },
              update: {
                role: "MANAGER",
                isActive: true,
              },
            }),
          ]);
        }

        // Update project
        const updatedProject = await prisma.project.update({
          where: { id: projectId },
          data: {
            ...(data.name && { name: data.name }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.status && { status: data.status }),
            ...(data.startDate !== undefined && {
              startDate: data.startDate ? new Date(data.startDate) : null,
            }),
            ...(data.endDate !== undefined && {
              endDate: data.endDate ? new Date(data.endDate) : null,
            }),
            ...(data.budget !== undefined && { budget: data.budget }),
            ...(data.clientId && { clientId: data.clientId }),
            ...(data.managerId && { managerId: data.managerId }),
            ...(data.color && { color: data.color }),
            ...(data.tags && { tags: data.tags }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
          },
          include: {
            client: {
              select: { id: true, name: true, logo: true },
            },
            manager: {
              select: userSelectMin,
            },
            members: {
              where: { isActive: true },
              include: {
                user: {
                  select: userSelectMin,
                },
              },
            },
            _count: {
              select: {
                tasks: true,
                meetings: true,
              },
            },
          },
        });

        // Log audit
        await logAudit({
          action: "PROJECT_UPDATE",
          userId: user.id,
          targetType: "PROJECT",
          targetId: projectId,
          metadata: {
            updatedFields: Object.keys(data),
          },
        });

        return NextResponse.json(
          {
            success: true,
            data: updatedProject,
            message: "Projeto atualizado com sucesso",
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("[PROJECT_PATCH]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}

// DELETE /api/projects/[projectId] - Desativa um projeto (soft delete)
export async function DELETE(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canDeleteProject", async (req: NextRequest, { user }) => {
      try {
        const { projectId } = params;

        // Check if project exists
        const project = await prisma.project.findUnique({
          where: { id: projectId, isActive: true },
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                tasks: { where: { isActive: true } },
              },
            },
          },
        });

        if (!project) {
          return NextResponse.json(
            { success: false, message: "Projeto não encontrado" },
            { status: 404 }
          );
        }

        // Soft delete - deactivate project
        await prisma.project.update({
          where: { id: projectId },
          data: {
            isActive: false,
            name: `${project.name} (Arquivado)`,
          },
        });

        // Deactivate all project members
        await prisma.projectMember.updateMany({
          where: { projectId },
          data: { isActive: false },
        });

        // Deactivate all tasks
        await prisma.task.updateMany({
          where: { projectId },
          data: { isActive: false },
        });

        // Log audit
        await logAudit({
          action: "PROJECT_DELETE",
          userId: user.id,
          targetType: "PROJECT",
          targetId: projectId,
          metadata: {
            projectName: project.name,
          },
        });

        return NextResponse.json(
          {
            success: true,
            message: "Projeto arquivado com sucesso",
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("[PROJECT_DELETE]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}
