import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withPermission } from "@/lib/middleware";
import { z } from "zod";
import {
  parsePaginationParams,
  parseSortParams,
  formatPaginatedResponse,
  parseRequestBody,
  handlePrismaError,
  logAudit,
  verifyProjectAccess,
} from "@/lib/api-helpers";
import { taskListInclude, getTasksByColumn } from "@/lib/queries/section-queries";

interface Params {
  params: { projectId: string };
}

const createTaskSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.record(z.unknown()).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE", "CANCELLED"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  estimatedHours: z.number().positive().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  columnId: z.string().uuid().optional(),
  assigneeIds: z.array(z.string().uuid()).max(10).optional(),
  ganttItemId: z.string().uuid().optional(),
  checklistItems: z
    .array(
      z.object({
        text: z.string().min(1),
        completed: z.boolean().default(false),
      })
    )
    .optional(),
});

// GET /api/projects/[projectId]/tasks - Lista tarefas
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

      const { searchParams } = new URL(req.url);

      // Check view mode
      const view = searchParams.get("view") || "list";

      // For kanban view
      if (view === "kanban") {
        const { columns, tasksByColumn } = await getTasksByColumn(projectId);

        return NextResponse.json(
          {
            success: true,
            data: {
              columns,
              tasksByColumn,
            },
          },
          { status: 200 }
        );
      }

      // For list view with pagination
      const { page, pageSize, skip, take } = parsePaginationParams(searchParams);
      const { sortBy, sortOrder } = parseSortParams(
        searchParams,
        ["createdAt", "dueDate", "priority", "title"],
        "createdAt",
        "desc"
      );

      // Parse filters
      const statusFilter = searchParams.getAll("status");
      const priority = searchParams.get("priority");
      const assigneeId = searchParams.get("assigneeId");
      const columnId = searchParams.get("columnId");
      const search = searchParams.get("search")?.trim();
      const tags = searchParams.getAll("tags");
      const overdue = searchParams.get("overdue");

      // Build where clause
      const where: any = {
        projectId,
        isActive: true,
        isArchived: false,
      };

      if (statusFilter.length > 0) where.status = { in: statusFilter };
      if (priority) where.priority = priority;
      if (assigneeId) {
        where.assignees = {
          some: { userId: assigneeId },
        };
      }
      if (columnId) where.columnId = columnId;
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { path: ["content"], string_contains: search } },
        ];
      }
      if (tags.length > 0) {
        where.tags = { hasSome: tags };
      }
      if (overdue === "true") {
        where.dueDate = { lt: new Date() };
        where.status = { not: "DONE" };
      }

      // Execute query
      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where,
          include: taskListInclude,
          skip,
          take,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.task.count({ where }),
      ]);

      // Calculate derived fields
      const tasksWithDerivedFields = tasks.map((task) => ({
        ...task,
        isOverdue:
          task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE",
        totalHoursLogged: task.logs.reduce((sum, log) => sum + log.hoursLogged, 0),
      }));

      return NextResponse.json(
        formatPaginatedResponse(tasksWithDerivedFields, total, page, pageSize),
        { status: 200 }
      );
    } catch (error) {
      console.error("[TASKS_GET]", error);
      return handlePrismaError(error);
    }
  })(req);
}

// POST /api/projects/[projectId]/tasks - Cria tarefa
export async function POST(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canCreateTasks", async (req: NextRequest, { user }) => {
      try {
        const { projectId } = params;

        // Parse and validate body
        const bodyResult = await parseRequestBody(req, createTaskSchema);
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

        // Get or create default column
        let columnId = data.columnId;
        if (!columnId) {
          const defaultColumn = await prisma.kanbanColumn.findFirst({
            where: { projectId, isActive: true },
            orderBy: { order: "asc" },
          });

          if (!defaultColumn) {
            return NextResponse.json(
              { success: false, message: "Nenhuma coluna disponível no kanban" },
              { status: 400 }
            );
          }

          columnId = defaultColumn.id;
        }

        // Verify column belongs to project
        const column = await prisma.kanbanColumn.findFirst({
          where: { id: columnId, projectId, isActive: true },
        });

        if (!column) {
          return NextResponse.json(
            { success: false, message: "Coluna não encontrada" },
            { status: 404 }
          );
        }

        // Calculate order
        const maxOrderTask = await prisma.task.findFirst({
          where: { columnId },
          orderBy: { order: "desc" },
          select: { order: true },
        });
        const newOrder = (maxOrderTask?.order ?? -1) + 1;

        // Create task in transaction
        const task = await prisma.$transaction(async (tx) => {
          // Create task
          const newTask = await tx.task.create({
            data: {
              projectId,
              title: data.title,
              description: data.description || {},
              status: column.taskStatus || data.status,
              priority: data.priority,
              dueDate: data.dueDate ? new Date(data.dueDate) : null,
              startDate: data.startDate ? new Date(data.startDate) : null,
              estimatedHours: data.estimatedHours,
              tags: data.tags || [],
              columnId,
              order: newOrder,
              ganttItemId: data.ganttItemId || null,
              checklistItems: data.checklistItems || [],
              createdById: user.id,
              isActive: true,
              isArchived: false,
            },
          });

          // Create assignees
          if (data.assigneeIds && data.assigneeIds.length > 0) {
            await tx.taskAssignee.createMany({
              data: data.assigneeIds.map((userId) => ({
                taskId: newTask.id,
                userId,
              })),
            });
          }

          return newTask;
        });

        // Notify assignees (non-blocking)
        if (data.assigneeIds && data.assigneeIds.length > 0) {
          prisma.notification
            .createMany({
              data: data.assigneeIds.map((assigneeId) => ({
                userId: assigneeId,
                type: "TASK_ASSIGNED",
                title: "Você foi atribuído a uma tarefa",
                message: `"${data.title}" em ${project.name}`,
                link: `/projects/${projectId}/tasks/${task.id}`,
                metadata: {
                  taskId: task.id,
                  projectId,
                },
              })),
            })
            .catch(console.error);
        }

        // Check if due date is within 24 hours
        if (data.dueDate) {
          const dueDate = new Date(data.dueDate);
          const now = new Date();
          const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

          if (hoursUntilDue <= 24 && hoursUntilDue > 0) {
            // Create due soon notification
            prisma.notification
              .createMany({
                data: (data.assigneeIds || []).map((assigneeId) => ({
                  userId: assigneeId,
                  type: "TASK_DUE_SOON",
                  title: "Tarefa com prazo próximo",
                  message: `"${data.title}" vence em breve`,
                  link: `/projects/${projectId}/tasks/${task.id}`,
                  metadata: {
                    taskId: task.id,
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
          action: "TASK_CREATE",
          userId: user.id,
          targetType: "TASK",
          targetId: task.id,
          metadata: {
            projectId,
            title: data.title,
            assignees: data.assigneeIds?.length || 0,
          },
        });

        return NextResponse.json(
          {
            success: true,
            data: task,
            message: "Tarefa criada com sucesso",
          },
          { status: 201 }
        );
      } catch (error) {
        console.error("[TASKS_POST]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}
