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
import { taskFullInclude } from "@/lib/queries/section-queries";

interface Params {
  params: { projectId: string; taskId: string };
}

const checklistItemSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1),
  completed: z.boolean(),
  completedAt: z.string().datetime().optional().nullable(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.record(z.unknown()).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  estimatedHours: z.number().positive().optional().nullable(),
  tags: z.array(z.string().max(50)).optional(),
  columnId: z.string().uuid().optional(),
  order: z.number().int().min(0).optional(),
  assigneeIds: z.array(z.string().uuid()).optional(),
  checklistItems: z.array(checklistItemSchema).optional(),
  ganttItemId: z.string().uuid().optional().nullable(),
  isArchived: z.boolean().optional(),
});

// GET /api/projects/[projectId]/tasks/[taskId]
export async function GET(req: NextRequest, { params }: Params) {
  return withAuth(async (req: NextRequest, { user }) => {
    try {
      const { projectId, taskId } = params;

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

      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          projectId,
          isActive: true,
        },
        include: taskFullInclude,
      });

      if (!task) {
        return NextResponse.json(
          { success: false, message: "Tarefa não encontrada" },
          { status: 404 }
        );
      }

      // Calculate derived fields
      const taskWithDerivedFields = {
        ...task,
        isOverdue:
          task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE",
        totalHoursLogged: task.logs.reduce((sum, log) => sum + log.hoursLogged, 0),
      };

      return NextResponse.json(
        { success: true, data: taskWithDerivedFields },
        { status: 200 }
      );
    } catch (error) {
      console.error("[TASK_GET]", error);
      return handlePrismaError(error);
    }
  })(req);
}

// PATCH /api/projects/[projectId]/tasks/[taskId]
export async function PATCH(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canUpdateTasks", async (req: NextRequest, { user }) => {
      try {
        const { projectId, taskId } = params;

        // Parse and validate body
        const bodyResult = await parseRequestBody(req, updateTaskSchema);
        if ("error" in bodyResult) return bodyResult.error;

        const data = bodyResult.data;

        // Get existing task
        const existingTask = await prisma.task.findFirst({
          where: {
            id: taskId,
            projectId,
            isActive: true,
          },
          include: {
            assignees: true,
          },
        });

        if (!existingTask) {
          return NextResponse.json(
            { success: false, message: "Tarefa não encontrada" },
            { status: 404 }
          );
        }

        // Check status change
        const isCompleting = data.status === "DONE" && existingTask.status !== "DONE";
        const isReopening = data.status && data.status !== "DONE" && existingTask.status === "DONE";

        // Update task in transaction
        const updatedTask = await prisma.$transaction(async (tx) => {
          const updateData: any = {
            ...(data.title && { title: data.title }),
            ...(data.description && { description: data.description }),
            ...(data.status && { status: data.status }),
            ...(data.priority && { priority: data.priority }),
            ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
            ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
            ...(data.estimatedHours !== undefined && { estimatedHours: data.estimatedHours }),
            ...(data.tags && { tags: data.tags }),
            ...(data.columnId && { columnId: data.columnId }),
            ...(data.order !== undefined && { order: data.order }),
            ...(data.ganttItemId !== undefined && { ganttItemId: data.ganttItemId }),
            ...(data.checklistItems && { checklistItems: data.checklistItems }),
            ...(data.isArchived !== undefined && { isArchived: data.isArchived }),
            ...(isCompleting && { completedAt: new Date() }),
            ...(isReopening && { completedAt: null }),
          };

          const updated = await tx.task.update({
            where: { id: taskId },
            data: updateData,
          });

          // Update assignees if provided
          if (data.assigneeIds) {
            // Remove existing assignees
            await tx.taskAssignee.deleteMany({
              where: { taskId },
            });

            // Add new assignees
            if (data.assigneeIds.length > 0) {
              await tx.taskAssignee.createMany({
                data: data.assigneeIds.map((userId) => ({
                  taskId,
                  userId,
                })),
              });
            }
          }

          return updated;
        });

        // Notify new assignees (non-blocking)
        if (data.assigneeIds) {
          const existingAssigneeIds = existingTask.assignees.map((a) => a.userId);
          const newAssigneeIds = data.assigneeIds.filter(
            (id) => !existingAssigneeIds.includes(id)
          );

          if (newAssigneeIds.length > 0) {
            prisma.notification
              .createMany({
                data: newAssigneeIds.map((assigneeId) => ({
                  userId: assigneeId,
                  type: "TASK_ASSIGNED",
                  title: "Você foi atribuído a uma tarefa",
                  message: `"${data.title || existingTask.title}"`,
                  link: `/projects/${projectId}/tasks/${taskId}`,
                  metadata: {
                    taskId,
                    projectId,
                  },
                })),
              })
              .catch(console.error);
          }
        }

        // Check due date proximity
        if (data.dueDate) {
          const dueDate = new Date(data.dueDate);
          const now = new Date();
          const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

          if (hoursUntilDue <= 24 && hoursUntilDue > 0) {
            const assignees = data.assigneeIds || existingTask.assignees.map((a) => a.userId);
            prisma.notification
              .createMany({
                data: assignees.map((assigneeId) => ({
                  userId: assigneeId,
                  type: "TASK_DUE_SOON",
                  title: "Tarefa com prazo próximo",
                  message: `"${data.title || existingTask.title}" vence em breve`,
                  link: `/projects/${projectId}/tasks/${taskId}`,
                  metadata: {
                    taskId,
                    projectId,
                    dueDate: data.dueDate,
                  },
                })),
              })
              .catch(console.error);
          }
        }

        // Log audit
        await logAudit({
          action: "TASK_UPDATE",
          userId: user.id,
          targetType: "TASK",
          targetId: taskId,
          metadata: {
            projectId,
            updatedFields: Object.keys(data),
            statusChanged: data.status !== undefined,
          },
        });

        return NextResponse.json(
          {
            success: true,
            data: updatedTask,
            message: "Tarefa atualizada com sucesso",
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("[TASK_PATCH]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}

// DELETE /api/projects/[projectId]/tasks/[taskId]
export async function DELETE(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canDeleteTasks", async (req: NextRequest, { user }) => {
      try {
        const { projectId, taskId } = params;
        const { searchParams } = new URL(req.url);
        const hard = searchParams.get("hard") === "true";

        // Get task
        const task = await prisma.task.findFirst({
          where: {
            id: taskId,
            projectId,
            isActive: true,
          },
        });

        if (!task) {
          return NextResponse.json(
            { success: false, message: "Tarefa não encontrada" },
            { status: 404 }
          );
        }

        if (hard) {
          // Hard delete - requires admin permission
          await prisma.task.delete({
            where: { id: taskId },
          });
        } else {
          // Soft delete - archive
          await prisma.task.update({
            where: { id: taskId },
            data: {
              isActive: false,
              isArchived: true,
            },
          });
        }

        // Log audit
        await logAudit({
          action: "TASK_DELETE",
          userId: user.id,
          targetType: "TASK",
          targetId: taskId,
          metadata: {
            projectId,
            title: task.title,
            hardDelete: hard,
          },
        });

        return NextResponse.json(
          {
            success: true,
            message: hard ? "Tarefa removida permanentemente" : "Tarefa arquivada com sucesso",
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("[TASK_DELETE]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}
