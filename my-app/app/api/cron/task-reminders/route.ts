import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/cron/task-reminders
// This endpoint should be called by a cron job service (Vercel Cron, etc.)
// It sends reminders for tasks due soon and overdue tasks
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("[CRON] CRON_SECRET not configured");
      return NextResponse.json(
        { success: false, message: "Cron secret not configured" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // 1. Tasks due tomorrow (reminder)
    const tasksDueTomorrow = await prisma.task.findMany({
      where: {
        dueDate: {
          gte: today,
          lte: tomorrow,
        },
        status: {
          not: "DONE",
        },
        isActive: true,
        isArchived: false,
      },
      include: {
        assignees: {
          select: {
            userId: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 2. Overdue tasks
    const overdueTasks = await prisma.task.findMany({
      where: {
        dueDate: {
          lt: today,
        },
        status: {
          not: "DONE",
        },
        isActive: true,
        isArchived: false,
      },
      include: {
        assignees: {
          select: {
            userId: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create notifications for tasks due tomorrow
    const dueTomorrowNotifications: any[] = [];
    for (const task of tasksDueTomorrow) {
      for (const assignee of task.assignees) {
        dueTomorrowNotifications.push({
          userId: assignee.userId,
          type: "TASK_DUE_SOON",
          title: "Tarefa com prazo próximo",
          message: `"${task.title}" vence amanhã`,
          link: `/projects/${task.project.id}/tasks/${task.id}`,
          metadata: {
            taskId: task.id,
            projectId: task.project.id,
            dueDate: task.dueDate,
          },
        });
      }
    }

    // Create notifications for overdue tasks
    const overdueNotifications: any[] = [];
    for (const task of overdueTasks) {
      for (const assignee of task.assignees) {
        overdueNotifications.push({
          userId: assignee.userId,
          type: "TASK_OVERDUE",
          title: "Tarefa atrasada",
          message: `"${task.title}" está atrasada`,
          link: `/projects/${task.project.id}/tasks/${task.id}`,
          metadata: {
            taskId: task.id,
            projectId: task.project.id,
            dueDate: task.dueDate,
          },
        });
      }

      // Also notify project admins
      const admins = await prisma.projectMember.findMany({
        where: {
          projectId: task.project.id,
          role: { in: ["MANAGER", "ADMIN"] },
          isActive: true,
        },
        select: { userId: true },
      });

      for (const admin of admins) {
        // Check if admin is not already an assignee
        const isAssignee = task.assignees.some((a) => a.userId === admin.userId);
        if (!isAssignee) {
          overdueNotifications.push({
            userId: admin.userId,
            type: "TASK_OVERDUE",
            title: "Tarefa atrasada no projeto",
            message: `"${task.title}" em ${task.project.name} está atrasada`,
            link: `/projects/${task.project.id}/tasks/${task.id}`,
            metadata: {
              taskId: task.id,
              projectId: task.project.id,
              dueDate: task.dueDate,
            },
          });
        }
      }
    }

    // 3. Budget alerts (projects with > 80% budget usage)
    const projects = await prisma.project.findMany({
      where: { isActive: true },
      include: {
        costs: {
          where: { isActive: true, type: "ACTUAL" },
          select: { amount: true },
        },
      },
    });

    const budgetAlerts: any[] = [];
    for (const project of projects) {
      if (project.budget <= 0) continue;

      const totalSpent = project.costs.reduce((sum, c) => sum + c.amount, 0);
      const usagePercentage = (totalSpent / project.budget) * 100;

      if (usagePercentage >= 80) {
        // Check if already notified today
        const todayNotifications = await prisma.notification.count({
          where: {
            type: "COST_ALERT",
            createdAt: {
              gte: today,
            },
            metadata: {
              path: ["projectId"],
              equals: project.id,
            },
          },
        });

        if (todayNotifications === 0) {
          // Notify project admins
          const admins = await prisma.projectMember.findMany({
            where: {
              projectId: project.id,
              role: { in: ["MANAGER", "ADMIN"] },
              isActive: true,
            },
            select: { userId: true },
          });

          for (const admin of admins) {
            budgetAlerts.push({
              userId: admin.userId,
              type: "COST_ALERT",
              title: "Alerta de orçamento",
              message: `O projeto "${project.name}" atingiu ${usagePercentage.toFixed(1)}% do orçamento`,
              link: `/projects/${project.id}/costs`,
              metadata: {
                projectId: project.id,
                budgetUsagePercentage: usagePercentage,
              },
            });
          }
        }
      }
    }

    // Create all notifications
    const allNotifications = [
      ...dueTomorrowNotifications,
      ...overdueNotifications,
      ...budgetAlerts,
    ];

    if (allNotifications.length > 0) {
      await prisma.notification.createMany({
        data: allNotifications,
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          tasksReminded: dueTomorrowNotifications.length,
          tasksOverdue: overdueNotifications.length,
          costAlerts: budgetAlerts.length,
          totalNotifications: allNotifications.length,
        },
        message: "Cron job executado com sucesso",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[CRON_TASK_REMINDERS]", error);
    return NextResponse.json(
      { success: false, message: "Erro ao executar cron job" },
      { status: 500 }
    );
  }
}
