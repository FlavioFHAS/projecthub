import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withPermission } from "@/lib/middleware";
import { z } from "zod";
import {
  parseRequestBody,
  handlePrismaError,
  logAudit,
  verifyProjectAccess,
} from "@/lib/api-helpers";

interface Params {
  params: { projectId: string };
}

const createColumnSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  taskStatus: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE", "CANCELLED"]).optional(),
});

const reorderColumnsSchema = z.object({
  columnIds: z.array(z.string().uuid()),
});

// GET /api/projects/[projectId]/kanban-columns
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

      const columns = await prisma.kanbanColumn.findMany({
        where: {
          projectId,
          isActive: true,
        },
        orderBy: { order: "asc" },
      });

      return NextResponse.json(
        { success: true, data: columns },
        { status: 200 }
      );
    } catch (error) {
      console.error("[KANBAN_COLUMNS_GET]", error);
      return handlePrismaError(error);
    }
  })(req);
}

// POST /api/projects/[projectId]/kanban-columns
export async function POST(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canEditProject", async (req: NextRequest, { user }) => {
      try {
        const { projectId } = params;

        // Parse and validate body
        const bodyResult = await parseRequestBody(req, createColumnSchema);
        if ("error" in bodyResult) return bodyResult.error;

        const data = bodyResult.data;

        // Verify project exists
        const project = await prisma.project.findUnique({
          where: { id: projectId, isActive: true },
        });

        if (!project) {
          return NextResponse.json(
            { success: false, message: "Projeto não encontrado" },
            { status: 404 }
          );
        }

        // Calculate order
        const lastColumn = await prisma.kanbanColumn.findFirst({
          where: { projectId, isActive: true },
          orderBy: { order: "desc" },
          select: { order: true },
        });
        const newOrder = (lastColumn?.order ?? -1) + 1;

        // Create column
        const column = await prisma.kanbanColumn.create({
          data: {
            projectId,
            name: data.name,
            color: data.color || "#6b7280",
            taskStatus: data.taskStatus,
            order: newOrder,
            isActive: true,
          },
        });

        // Log audit
        await logAudit({
          action: "KANBAN_COLUMN_CREATE",
          userId: user.id,
          targetType: "KANBAN_COLUMN",
          targetId: column.id,
          metadata: {
            projectId,
            name: data.name,
          },
        });

        return NextResponse.json(
          {
            success: true,
            data: column,
            message: "Coluna criada com sucesso",
          },
          { status: 201 }
        );
      } catch (error) {
        console.error("[KANBAN_COLUMNS_POST]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}

// PATCH /api/projects/[projectId]/kanban-columns/reorder
export async function PATCH(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canEditProject", async (req: NextRequest, { user }) => {
      try {
        const { projectId } = params;

        // Parse and validate body
        const bodyResult = await parseRequestBody(req, reorderColumnsSchema);
        if ("error" in bodyResult) return bodyResult.error;

        const { columnIds } = bodyResult.data;

        // Verify all columns belong to this project
        const columns = await prisma.kanbanColumn.findMany({
          where: {
            id: { in: columnIds },
            projectId,
            isActive: true,
          },
        });

        if (columns.length !== columnIds.length) {
          return NextResponse.json(
            {
              success: false,
              message: "Uma ou mais colunas não pertencem a este projeto",
            },
            { status: 400 }
          );
        }

        // Update orders in transaction
        await prisma.$transaction(
          columnIds.map((id, index) =>
            prisma.kanbanColumn.update({
              where: { id },
              data: { order: index },
            })
          )
        );

        // Log audit
        await logAudit({
          action: "KANBAN_COLUMNS_REORDER",
          userId: user.id,
          targetType: "PROJECT",
          targetId: projectId,
          metadata: {
            columnIds,
          },
        });

        return NextResponse.json(
          {
            success: true,
            message: "Colunas reordenadas com sucesso",
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("[KANBAN_COLUMNS_REORDER]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}
