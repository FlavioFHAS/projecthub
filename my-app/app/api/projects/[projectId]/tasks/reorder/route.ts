import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withPermission } from "@/lib/middleware";
import { z } from "zod";
import { parseRequestBody, handlePrismaError, logAudit } from "@/lib/api-helpers";

interface Params {
  params: { projectId: string };
}

const reorderTasksSchema = z.object({
  tasks: z.array(
    z.object({
      id: z.string().uuid(),
      columnId: z.string().uuid(),
      order: z.number().int().min(0),
      status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE", "CANCELLED"]).optional(),
    })
  ),
});

// PATCH /api/projects/[projectId]/tasks/reorder
export async function PATCH(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canUpdateTasks", async (req: NextRequest, { user }) => {
      try {
        const { projectId } = params;

        // Parse and validate body
        const bodyResult = await parseRequestBody(req, reorderTasksSchema);
        if ("error" in bodyResult) return bodyResult.error;

        const { tasks } = bodyResult.data;

        // Verify all tasks belong to this project
        const taskIds = tasks.map((t) => t.id);
        const validTasks = await prisma.task.findMany({
          where: {
            id: { in: taskIds },
            projectId,
            isActive: true,
          },
          select: { id: true, columnId: true, status: true },
        });

        const validTaskIds = new Set(validTasks.map((t) => t.id));
        const invalidIds = taskIds.filter((id) => !validTaskIds.has(id));

        if (invalidIds.length > 0) {
          return NextResponse.json(
            {
              success: false,
              message: "Algumas tarefas não pertencem a este projeto",
              errors: { tasks: [`IDs inválidos: ${invalidIds.join(", ")}`] },
            },
            { status: 400 }
          );
        }

        // Verify all columns belong to this project
        const columnIds = [...new Set(tasks.map((t) => t.columnId))];
        const validColumns = await prisma.kanbanColumn.findMany({
          where: {
            id: { in: columnIds },
            projectId,
            isActive: true,
          },
          select: { id: true, taskStatus: true },
        });

        const columnMap = new Map(validColumns.map((c) => [c.id, c]));
        const invalidColumns = columnIds.filter((id) => !columnMap.has(id));

        if (invalidColumns.length > 0) {
          return NextResponse.json(
            {
              success: false,
              message: "Algumas colunas não pertencem a este projeto",
              errors: { columns: [`IDs inválidos: ${invalidColumns.join(", ")}`] },
            },
            { status: 400 }
          );
        }

        // Update all tasks in transaction
        await prisma.$transaction(async (tx) => {
          for (const task of tasks) {
            const column = columnMap.get(task.columnId);
            const updateData: any = {
              columnId: task.columnId,
              order: task.order,
            };

            // Update status if column has mapped status and status is provided
            if (column?.taskStatus && task.status) {
              updateData.status = task.status;
            } else if (column?.taskStatus) {
              updateData.status = column.taskStatus;
            }

            await tx.task.update({
              where: { id: task.id },
              data: updateData,
            });
          }
        });

        // Log audit
        await logAudit({
          action: "TASKS_REORDER",
          userId: user.id,
          targetType: "PROJECT",
          targetId: projectId,
          metadata: {
            tasksReordered: tasks.length,
          },
        });

        return NextResponse.json(
          {
            success: true,
            message: `${tasks.length} tarefa(s) reordenada(s) com sucesso`,
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("[TASKS_REORDER]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}
