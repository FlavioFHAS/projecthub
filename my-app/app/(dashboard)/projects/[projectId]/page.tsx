import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyProjectAccess } from "@/lib/permissions";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  TrendingUp,
  Users,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/project/MetricCard";
import { ActivityFeed } from "@/components/project/ActivityFeed";
import { canManageProject } from "@/lib/permissions";
import { formatCurrency, getDaysRemaining, getPriorityColor } from "@/lib/projects/board-utils";

async function getProjectOverview(projectId: string, userRole: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      client: { select: { name: true } },
      _count: {
        select: {
          tasks: true,
        },
      },
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
        },
        where: {
          status: { not: "COMPLETED" },
        },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        take: 5,
      },
      meetings: {
        where: {
          date: { gte: new Date() },
        },
        orderBy: { date: "asc" },
        take: 3,
      },
    },
  });

  if (!project) return null;

  // Calculate metrics
  const totalTasks = await prisma.task.count({
    where: { projectId },
  });

  const completedTasks = await prisma.task.count({
    where: { projectId, status: "COMPLETED" },
  });

  const inProgressTasks = await prisma.task.count({
    where: { projectId, status: "IN_PROGRESS" },
  });

  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Get recent activity
  const activities = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entity: "Project", entityId: projectId },
        {
          entity: "Task",
          entityId: {
            in: (
              await prisma.task.findMany({
                where: { projectId },
                select: { id: true },
              })
            ).map((t) => t.id),
          },
        },
      ],
    },
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return {
    project: {
      ...project,
      progress,
      totalTasks,
      completedTasks,
      inProgressTasks,
    },
    activities,
  };
}

interface Props {
  params: { projectId: string };
}

export default async function ProjectOverviewPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const hasAccess = await verifyProjectAccess(
    params.projectId,
    session.user.id,
    session.user.role
  );
  if (!hasAccess) redirect("/projects");

  const data = await getProjectOverview(params.projectId, session.user.role);
  if (!data) notFound();

  const { project, activities } = data;
  const canManage = canManageProject(session.user.role);
  const daysRemaining = getDaysRemaining(project.endDate);

  // Filter urgent tasks (HIGH priority or due within 7 days)
  const urgentTasks = project.tasks.filter(
    (task) =>
      task.priority === "HIGH" ||
      task.priority === "URGENT" ||
      (task.dueDate &&
        new Date(task.dueDate).getTime() - new Date().getTime() <
          7 * 24 * 60 * 60 * 1000)
  );

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Bem-vindo ao projeto
        </h2>
        <p className="text-muted-foreground">
          Acompanhe o progresso e atividades do {project.name}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {canManage ? (
          <>
            <MetricCard
              title="Progresso Geral"
              value={`${project.progress}%`}
              subtitle={`${project.completedTasks} de ${project.totalTasks} tarefas`}
              icon={<TrendingUp className="h-4 w-4" />}
              variant={project.progress >= 75 ? "success" : project.progress >= 50 ? "default" : "warning"}
            >
              <Progress value={project.progress} className="h-2 mt-2" />
            </MetricCard>

            <MetricCard
              title="Tarefas Abertas"
              value={project._count.tasks}
              subtitle={`${project.inProgressTasks} em progresso`}
              icon={<CheckCircle2 className="h-4 w-4" />}
              variant={project._count.tasks > 10 ? "warning" : "default"}
            />

            {project.budget && (
              <MetricCard
                title="Orçamento"
                value={formatCurrency(project.budget)}
                subtitle="Planejado para o projeto"
                icon={<TrendingUp className="h-4 w-4" />}
              />
            )}

            <MetricCard
              title="Dias Restantes"
              value={daysRemaining.days?.toString() || "—"}
              subtitle={daysRemaining.label}
              icon={<Clock className="h-4 w-4" />}
              variant={daysRemaining.variant}
            />
          </>
        ) : (
          <>
            <MetricCard
              title="Progresso"
              value={`${project.progress}%`}
              subtitle={`${project.completedTasks} tarefas concluídas`}
              icon={<TrendingUp className="h-4 w-4" />}
            >
              <Progress value={project.progress} className="h-2 mt-2" />
            </MetricCard>

            <MetricCard
              title="Minhas Tarefas"
              value={project._count.tasks.toString()}
              subtitle="Tarefas atribuídas a você"
              icon={<CheckCircle2 className="h-4 w-4" />}
            />

            <MetricCard
              title="Dias Restantes"
              value={daysRemaining.days?.toString() || "—"}
              subtitle={daysRemaining.label}
              icon={<Clock className="h-4 w-4" />}
              variant={daysRemaining.variant}
            />
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Activity Feed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed activities={activities} />
          </CardContent>
        </Card>

        {/* Upcoming Meetings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Próximas Reuniões</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/projects/${params.projectId}/meetings`}>
                Ver todas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.meetings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma reunião agendada
              </p>
            ) : (
              project.meetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{meeting.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(meeting.date).toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Urgent Tasks */}
      {urgentTasks.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Tarefas Urgentes
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/projects/${params.projectId}/tasks`}>
                Ver todas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {urgentTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className={getPriorityColor(task.priority)}
                    >
                      {task.priority === "HIGH"
                        ? "Alta"
                        : task.priority === "URGENT"
                        ? "Urgente"
                        : task.priority === "CRITICAL"
                        ? "Crítica"
                        : "Média"}
                    </Badge>
                    {task.dueDate && (
                      <span className="text-sm text-muted-foreground">
                        Vence em{" "}
                        {new Date(task.dueDate).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
