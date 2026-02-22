import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyProjectAccess } from "@/lib/permissions";
import { TasksClient } from "@/components/tasks/TasksClient";

async function getTasksData(projectId: string, userRole: string) {
  const [tasks, columns, members] = await Promise.all([
    prisma.task.findMany({
      where: { projectId, isArchived: false },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: [{ order: "asc" }],
    }),
    prisma.kanbanColumn.findMany({
      where: { projectId },
      orderBy: { order: "asc" },
    }),
    prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return { tasks, columns, members };
}

interface Props {
  params: { projectId: string };
}

export default async function TasksPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const hasAccess = await verifyProjectAccess(
    params.projectId,
    session.user.id,
    session.user.role
  );
  if (!hasAccess) redirect("/projects");

  const { tasks, columns, members } = await getTasksData(
    params.projectId,
    session.user.role
  );

  return (
    <TasksClient
      initialTasks={tasks as any}
      initialColumns={columns as any}
      members={members.map((m) => m.user) as any}
      projectId={params.projectId}
    />
  );
}
