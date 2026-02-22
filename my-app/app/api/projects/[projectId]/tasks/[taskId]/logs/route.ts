import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withPermission } from "@/lib/middleware";
import { z } from "zod";
import { parseRequestBody, handlePrismaError, logAudit } from "@/lib/api-helpers";
import { userSelectMin } from "@/lib/queries/user-queries";

interface Params {
  params: { projectId: string; taskId: string };
}

const createLogSchema = z.object({
  hoursLogged: z.number().positive().max(24),
  date: z.string().datetime(),
  description: z.string().max(500).optional(),
});

// GET /api/projects/[projectId]/tasks/[taskId]/logs
export async function GET(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canViewTasks", async (req: NextRequest, { user }) => {
      try {
        const { projectId, taskId } = params;

        const logs = await prisma.taskLog.findMany({
          where: {
            taskId,
            task: {
              projectId,
            },
          },
          include: {
            user: {
              select: userSelectMin,
            },
          },
          orderBy: { date: "desc" },
        });

        const totalHoursLogged = logs.reduce((sum, log) => sum + log.hoursLogged, 0);

        return NextResponse.json(
          {
            success: true,
            data: logs,
            meta: {
              totalHoursLogged,
            },
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("[TASK_LOGS_GET]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}

// POST /api/projects/[projectId]/tasks/[taskId]/logs
export async function POST(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canLogHours", async (req: NextRequest, { user }) => {
      try {
        const { projectId, taskId } = params;

        // Parse and validate body
        const bodyResult = await parseRequestBody(req, createLogSchema);
        if ("error" in bodyResult) return bodyResult.error;

        const data = bodyResult.data;

        // Verify task exists
        const task = await prisma.task.findFirst({
          where: {
            id: taskId,
            projectId,
            isActive: true,
          },
          select: { id: true, title: true },
        });

        if (!task) {
          return NextResponse.json(
            { success: false, message: "Tarefa não encontrada" },
            { status: 404 }
          );
        }

        // Create log
        const log = await prisma.taskLog.create({
          data: {
            taskId,
            userId: user.id,
            hoursLogged: data.hoursLogged,
            date: new Date(data.date),
            description: data.description,
          },
          include: {
            user: {
              select: userSelectMin,
            },
          },
        });

        // Calculate total hours
        const totalHours = await prisma.taskLog.aggregate({
          where: { taskId },
          _sum: { hoursLogged: true },
        });

        // Log audit
        await logAudit({
          action: "TASK_LOG_CREATE",
          userId: user.id,
          targetType: "TASK_LOG",
          targetId: log.id,
          metadata: {
            projectId,
            taskId,
            hoursLogged: data.hoursLogged,
          },
        });

        return NextResponse.json(
          {
            success: true,
            data: log,
            meta: {
              totalHoursLogged: totalHours._sum.hoursLogged || 0,
            },
            message: "Horas registradas com sucesso",
          },
          { status: 201 }
        );
      } catch (error) {
        console.error("[TASK_LOGS_POST]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}
