import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withPermission } from "@/lib/middleware";
import { z } from "zod";
import { parseRequestBody, handlePrismaError, logAudit } from "@/lib/api-helpers";

interface Params {
  params: { projectId: string; meetingId: string };
}

const convertSchema = z.object({
  nextStepIndices: z.array(z.number().int().min(0)).optional(),
});

// POST /api/projects/[projectId]/meetings/[meetingId]/convert-to-tasks
export async function POST(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canCreateTasks", async (req: NextRequest, { user }) => {
      try {
        const { projectId, meetingId } = params;

        // Parse and validate body
        const bodyResult = await parseRequestBody(req, convertSchema);
        if ("error" in bodyResult) return bodyResult.error;

        const { nextStepIndices } = bodyResult.data;

        // Get meeting with next steps
        const meeting = await prisma.meeting.findFirst({
          where: {
            id: meetingId,
            projectId,
            isActive: true,
          },
          select: {
            id: true,
            title: true,
            nextSteps: true,
          },
        });

        if (!meeting) {
          return NextResponse.json(
            { success: false, message: "Reunião não encontrada" },
            { status: 404 }
          );
        }

        if (!meeting.nextSteps || meeting.nextSteps.length === 0) {
          return NextResponse.json(
            { success: false, message: "Esta reunião não possui próximos passos" },
            { status: 400 }
          );
        }

        // Get first kanban column for default
        const firstColumn = await prisma.kanbanColumn.findFirst({
          where: { projectId, isActive: true },
          orderBy: { order: "asc" },
        });

        if (!firstColumn) {
          return NextResponse.json(
            { success: false, message: "Projeto não possui colunas no kanban" },
            { status: 400 }
          );
        }

        // Determine which next steps to convert
        const stepsToConvert = nextStepIndices
          ? nextStepIndices
              .map((i) => meeting.nextSteps?.[i])
              .filter(Boolean) as any[]
          : meeting.nextSteps;

        if (stepsToConvert.length === 0) {
          return NextResponse.json(
            { success: false, message: "Nenhum próximo passo válido para converter" },
            { status: 400 }
          );
        }

        // Create tasks in transaction
        const createdTasks = await prisma.$transaction(async (tx) => {
          const tasks = [];

          for (const step of stepsToConvert) {
            // Get max order in column
            const maxOrderTask = await tx.task.findFirst({
              where: { columnId: firstColumn.id },
              orderBy: { order: "desc" },
              select: { order: true },
            });
            const newOrder = (maxOrderTask?.order ?? -1) + 1;

            // Create task
            const task = await tx.task.create({
              data: {
                projectId,
                title: step.description,
                description: {
                  type: "doc",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: `Criado a partir da reunião: ${meeting.title}`,
                        },
                      ],
                    },
                  ],
                },
                status: firstColumn.taskStatus || "TODO",
                priority: "MEDIUM",
                dueDate: step.dueDate ? new Date(step.dueDate) : null,
                columnId: firstColumn.id,
                order: newOrder,
                createdById: user.id,
                isActive: true,
                isArchived: false,
                metadata: {
                  meetingId,
                  convertedFrom: "meeting_next_step",
                },
              },
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                dueDate: true,
              },
            });

            // Assign responsible if provided
            if (step.responsibleId) {
              await tx.taskAssignee.create({
                data: {
                  taskId: task.id,
                  userId: step.responsibleId,
                },
              });

              // Notify assignee
              await tx.notification.create({
                data: {
                  userId: step.responsibleId,
                  type: "TASK_ASSIGNED",
                  title: "Você foi atribuído a uma tarefa",
                  message: `"${task.title}"`,
                  link: `/projects/${projectId}/tasks/${task.id}`,
                  metadata: {
                    taskId: task.id,
                    projectId,
                  },
                },
              });
            }

            tasks.push(task);
          }

          return tasks;
        });

        // Log audit
        await logAudit({
          action: "MEETING_CONVERT_TO_TASKS",
          userId: user.id,
          targetType: "MEETING",
          targetId: meetingId,
          metadata: {
            projectId,
            tasksCreated: createdTasks.length,
            taskIds: createdTasks.map((t) => t.id),
          },
        });

        return NextResponse.json(
          {
            success: true,
            data: createdTasks,
            message: `${createdTasks.length} tarefa(s) criada(s) com sucesso`,
          },
          { status: 201 }
        );
      } catch (error) {
        console.error("[MEETING_CONVERT_TO_TASKS]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}
