import { prisma } from "@/lib/prisma";
import { startOfWeek, endOfWeek, subDays, format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

// User select minimal
const userSelectMin = {
  id: true,
  name: true,
  email: true,
  image: true,
};

// Project stats for admin dashboard
export async function getProjectStats(where: any) {
  const [total, byStatus, active] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.groupBy({
      by: ["status"],
      where,
      _count: true,
    }),
    prisma.project.count({
      where: { ...where, status: "ACTIVE" },
    }),
  ]);

  const statusMap: Record<string, number> = {};
  byStatus.forEach((s) => {
    statusMap[s.status] = s._count;
  });

  return { total, byStatus: statusMap, active };
}

// Client stats
export async function getClientStats(user: any) {
  const where = user.role === "SUPER_ADMIN" ? {} : { adminId: user.id };

  const [total, active, newThisMonth] = await Promise.all([
    prisma.client.count({ where }),
    prisma.client.count({ where: { ...where, status: "ACTIVE" } }),
    prisma.client.count({
      where: {
        ...where,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
  ]);

  return { total, active, newThisMonth };
}

// User/member stats
export async function getUserStats(user: any) {
  const where = user.role === "SUPER_ADMIN" ? {} : { role: { not: "SUPER_ADMIN" } };

  const [total, active] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.count({ where: { ...where, status: "ACTIVE" } }),
  ]);

  return { total, active };
}

// Task stats
export async function getTaskStats(where: any) {
  const projectWhere = where.project ? where : { project: where };

  const [total, open, overdue, completedThisWeek] = await Promise.all([
    prisma.task.count({ where: projectWhere }),
    prisma.task.count({
      where: {
        ...projectWhere,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
    }),
    prisma.task.count({
      where: {
        ...projectWhere,
        dueDate: { lt: new Date() },
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
    }),
    prisma.task.count({
      where: {
        ...projectWhere,
        status: "COMPLETED",
        updatedAt: {
          gte: startOfWeek(new Date(), { locale: ptBR }),
        },
      },
    }),
  ]);

  return { total, open, overdue, completedThisWeek };
}

// Cost stats
export async function getCostStats(where: any) {
  const projectIds = await prisma.project
    .findMany({ where, select: { id: true } })
    .then((ps) => ps.map((p) => p.id));

  const [entries, pending, approved] = await Promise.all([
    prisma.costEntry.findMany({
      where: { projectId: { in: projectIds } },
    }),
    prisma.costEntry.findMany({
      where: { projectId: { in: projectIds }, status: "PENDING" },
    }),
    prisma.costEntry.findMany({
      where: { projectId: { in: projectIds }, status: { in: ["APPROVED", "PAID"] } },
    }),
  ]);

  const totalActual = entries.reduce((sum, e) => sum + e.amount * e.quantity, 0);
  const totalPending = pending.reduce((sum, e) => sum + e.amount * e.quantity, 0);
  const totalApproved = approved.reduce((sum, e) => sum + e.amount * e.quantity, 0);

  return { totalActual, totalPending, totalApproved, pendingCount: pending.length };
}

// Weekly activity (tasks completed per day)
export async function getWeeklyActivity(where: any) {
  const weekStart = startOfWeek(new Date(), { locale: ptBR });
  const weekEnd = endOfWeek(new Date(), { locale: ptBR });
  const projectIds = await prisma.project
    .findMany({ where, select: { id: true } })
    .then((ps) => ps.map((p) => p.id));

  const tasks = await prisma.task.findMany({
    where: {
      projectId: { in: projectIds },
      status: "COMPLETED",
      updatedAt: { gte: weekStart, lte: weekEnd },
    },
    select: { updatedAt: true },
  });

  // Group by day
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const activity: Record<string, number> = {};

  days.forEach((d) => (activity[d] = 0));

  tasks.forEach((t) => {
    const day = days[t.updatedAt.getDay()];
    activity[day]++;
  });

  return Object.entries(activity).map(([day, count]) => ({ day, count }));
}

// Upcoming meetings
export async function getUpcomingMeetings(where: any, limit: number = 5) {
  const projectIds = await prisma.project
    .findMany({ where, select: { id: true } })
    .then((ps) => ps.map((p) => p.id));

  return prisma.meeting.findMany({
    where: {
      projectId: { in: projectIds },
      date: { gte: new Date() },
      status: "SCHEDULED",
    },
    orderBy: { date: "asc" },
    take: limit,
    include: {
      project: { select: { id: true, name: true } },
    },
  });
}

// Overdue items
export async function getOverdueItems(where: any) {
  const projectIds = await prisma.project
    .findMany({ where, select: { id: true } })
    .then((ps) => ps.map((p) => p.id));

  const [tasks, pendingCosts] = await Promise.all([
    prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        dueDate: { lt: new Date() },
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        isArchived: false,
      },
      include: {
        project: { select: { id: true, name: true } },
        assignees: {
          include: { user: { select: userSelectMin } },
        },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.costEntry.findMany({
      where: {
        projectId: { in: projectIds },
        status: "PENDING",
      },
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
  ]);

  return { tasks, pendingCosts };
}

// Recent activity
export async function getRecentActivity(where: any, limit: number = 10) {
  const projectIds = await prisma.project
    .findMany({ where, select: { id: true } })
    .then((ps) => ps.map((p) => p.id));

  return prisma.auditLog.findMany({
    where: { projectId: { in: projectIds } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: userSelectMin },
      project: { select: { id: true, name: true } },
    },
  });
}

// Active projects with details
export async function getActiveProjects(where: any, limit: number = 8) {
  const projects = await prisma.project.findMany({
    where: { ...where, status: "ACTIVE" },
    include: {
      client: { select: { id: true, name: true } },
      members: {
        include: { user: { select: userSelectMin } },
        take: 3,
      },
      _count: {
        select: {
          tasks: { where: { status: { notIn: ["COMPLETED", "CANCELLED"] } } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  return projects.map((p) => ({
    ...p,
    openTasks: p._count.tasks,
  }));
}

// Collaborator: My tasks
export async function getMyTasks(userId: string) {
  return prisma.task.findMany({
    where: {
      assignees: { some: { userId } },
      isArchived: false,
      status: { notIn: ["COMPLETED", "CANCELLED"] },
    },
    include: {
      project: { select: { id: true, name: true, color: true } },
      assignees: {
        include: { user: { select: userSelectMin } },
      },
    },
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
    take: 20,
  });
}

// Collaborator: My projects
export async function getMyProjects(userId: string) {
  return prisma.project.findMany({
    where: {
      members: { some: { userId, isActive: true } },
      status: "ACTIVE",
    },
    include: {
      client: { select: { id: true, name: true } },
      _count: {
        select: {
          tasks: {
            where: {
              assignees: { some: { userId } },
              status: { notIn: ["COMPLETED", "CANCELLED"] },
            },
          },
        },
      },
    },
    take: 6,
  });
}

// Collaborator: Weekly stats
export async function getWeeklyTaskStats(userId: string) {
  const weekStart = startOfWeek(new Date(), { locale: ptBR });
  const weekEnd = endOfWeek(new Date(), { locale: ptBR });

  const [completed, inProgress, overdue, total] = await Promise.all([
    prisma.task.count({
      where: {
        assignees: { some: { userId } },
        status: "COMPLETED",
        updatedAt: { gte: weekStart, lte: weekEnd },
      },
    }),
    prisma.task.count({
      where: {
        assignees: { some: { userId } },
        status: "IN_PROGRESS",
        isArchived: false,
      },
    }),
    prisma.task.count({
      where: {
        assignees: { some: { userId } },
        dueDate: { lt: new Date() },
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        isArchived: false,
      },
    }),
    prisma.task.count({
      where: {
        assignees: { some: { userId } },
        isArchived: false,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
    }),
  ]);

  return { completed, inProgress, overdue, total };
}

// Activity heatmap data
export async function getActivityHeatmap(userId: string, days: number = 14) {
  const since = subDays(new Date(), days);

  const logs = await prisma.auditLog.findMany({
    where: {
      userId,
      createdAt: { gte: since },
    },
    select: { createdAt: true },
  });

  // Group by date
  const grouped: Record<string, number> = {};

  logs.forEach((log) => {
    const date = format(log.createdAt, "yyyy-MM-dd");
    grouped[date] = (grouped[date] || 0) + 1;
  });

  return Object.entries(grouped).map(([date, count]) => ({ date, count }));
}

// Client: My projects
export async function getClientProjects(userId: string) {
  return prisma.project.findMany({
    where: {
      members: { some: { userId, isActive: true } },
      status: { not: "COMPLETED" },
    },
    include: {
      client: { select: { id: true, name: true, logo: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

// Client: Upcoming meetings
export async function getClientMeetings(userId: string, limit: number = 5) {
  return prisma.meeting.findMany({
    where: {
      project: {
        members: { some: { userId } },
      },
      date: { gte: new Date() },
      status: "SCHEDULED",
    },
    include: {
      project: { select: { id: true, name: true } },
    },
    orderBy: { date: "asc" },
    take: limit,
  });
}

// Client: Recent proposals
export async function getClientProposals(userId: string, limit: number = 3) {
  return prisma.proposal.findMany({
    where: {
      project: {
        members: { some: { userId } },
      },
      status: "APPROVED",
    },
    include: {
      project: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

// Format currency helper
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// Get greeting based on time
export function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();

  if (hour < 12) return { text: "Bom dia", emoji: "☀️" };
  if (hour < 18) return { text: "Boa tarde", emoji: "🌤️" };
  return { text: "Boa noite", emoji: "🌙" };
}

// Format relative time
export function getRelativeTime(date: Date): string {
  const days = differenceInDays(date, new Date());

  if (days === 0) return "Hoje";
  if (days === 1) return "Amanhã";
  if (days === -1) return "Ontem";
  if (days > 1) return `Em ${days} dias`;
  return `Há ${Math.abs(days)} dias`;
}
