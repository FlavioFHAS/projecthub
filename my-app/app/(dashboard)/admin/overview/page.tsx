import { prisma } from "@/lib/prisma"
import { Role, ProjectStatus, TaskStatus } from "@prisma/client"
import { subDays, subMonths, format, startOfMonth } from "date-fns"
import { AdminOverview } from "@/components/admin/AdminOverview"

async function getPlatformStats() {
  const [
    totalUsers,
    activeUsersLastMonth,
    usersByRole,
    totalClients,
    clientsWithActiveProjects,
    totalProjects,
    projectsByStatus,
    totalTasks,
    tasksCompletedThisMonth,
  ] = await Promise.all([
    // Total de usuários
    prisma.user.count(),

    // Usuários ativos nos últimos 30 dias (com base em audit logs)
    prisma.auditLog
      .groupBy({
        by: ["userId"],
        where: {
          createdAt: { gte: subDays(new Date(), 30) },
        },
      })
      .then((logs) => logs.length),

    // Usuários por role
    prisma.user.groupBy({
      by: ["role"],
      _count: { role: true },
    }),

    // Total de clientes
    prisma.client.count(),

    // Clientes com projetos ativos
    prisma.client.count({
      where: {
        projects: {
          some: { status: ProjectStatus.ACTIVE },
        },
      },
    }),

    // Total de projetos
    prisma.project.count(),

    // Projetos por status
    prisma.project.groupBy({
      by: ["status"],
      _count: { status: true },
    }),

    // Total de tarefas
    prisma.task.count(),

    // Tarefas concluídas este mês
    prisma.task.count({
      where: {
        status: TaskStatus.DONE,
        updatedAt: {
          gte: startOfMonth(new Date()),
        },
      },
    }),
  ])

  return {
    totalUsers: {
      count: totalUsers,
      activeLastMonth: activeUsersLastMonth,
      byRole: usersByRole.reduce(
        (acc, u) => {
          acc[u.role] = u._count.role
          return acc
        },
        {} as Record<string, number>
      ),
    },
    totalClients: {
      count: totalClients,
      activeProjects: clientsWithActiveProjects,
    },
    totalProjects: {
      count: totalProjects,
      byStatus: projectsByStatus.reduce(
        (acc, p) => {
          acc[p.status] = p._count.status
          return acc
        },
        {} as Record<string, number>
      ),
    },
    totalTasks: {
      count: totalTasks,
      completedThisMonth: tasksCompletedThisMonth,
    },
  }
}

async function getGrowthMetrics() {
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i)
    return {
      month: format(date, "MMM/yyyy"),
      startDate: startOfMonth(date),
      endDate: subDays(startOfMonth(subMonths(date, -1)), 1),
    }
  })

  const [newUsersPerMonth, newProjectsPerMonth, tasksCompletedPerMonth] =
    await Promise.all([
      // Novos usuários por mês
      Promise.all(
        months.map(async (m) => ({
          month: m.month,
          count: await prisma.user.count({
            where: {
              createdAt: {
                gte: m.startDate,
                lte: m.endDate,
              },
            },
          }),
        }))
      ),

      // Novos projetos por mês
      Promise.all(
        months.map(async (m) => ({
          month: m.month,
          count: await prisma.project.count({
            where: {
              createdAt: {
                gte: m.startDate,
                lte: m.endDate,
              },
            },
          }),
        }))
      ),

      // Tarefas concluídas por mês
      Promise.all(
        months.map(async (m) => ({
          month: m.month,
          count: await prisma.task.count({
            where: {
              status: TaskStatus.DONE,
              updatedAt: {
                gte: m.startDate,
                lte: m.endDate,
              },
            },
          }),
        }))
      ),
    ])

  return {
    newUsersPerMonth,
    newProjectsPerMonth,
    tasksCompletedPerMonth,
  }
}

async function getTopProjectsByActivity() {
  const projects = await prisma.project.findMany({
    where: { status: ProjectStatus.ACTIVE },
    take: 10,
    include: {
      _count: {
        select: {
          tasks: true,
          members: true,
          auditLogs: {
            where: {
              createdAt: { gte: subDays(new Date(), 30) },
            },
          },
        },
      },
      client: {
        select: { name: true },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  })

  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    client: p.client.name,
    status: p.status,
    progress: p.progress,
    taskCount: p._count.tasks,
    memberCount: p._count.members,
    activityCount: p._count.auditLogs,
  }))
}

async function getSystemHealth() {
  // Simulação de métricas de saúde do sistema
  // Em produção, isso viria de monitoramento real

  const startTime = Date.now()
  await prisma.$queryRaw`SELECT 1`
  const dbResponseMs = Date.now() - startTime

  return {
    dbResponseMs,
    activeSSEConns: 0, // Seria obtido do Map global de conexões
    notifQueueSize: 0, // Seria obtido de uma fila real
  }
}

export default async function AdminOverviewPage() {
  const [platformStats, growth, topProjects, systemHealth] = await Promise.all(
    [
      getPlatformStats(),
      getGrowthMetrics(),
      getTopProjectsByActivity(),
      getSystemHealth(),
    ]
  )

  return (
    <AdminOverview
      platformStats={platformStats}
      growth={growth}
      topProjects={topProjects}
      systemHealth={systemHealth}
    />
  )
}
