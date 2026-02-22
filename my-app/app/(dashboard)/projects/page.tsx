import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProjectsBoard } from "@/components/projects/ProjectsBoard";

async function getProjects(userId: string, userRole: string) {
  const where = userRole === "SUPER_ADMIN" 
    ? {} 
    : {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      };

  const projects = await prisma.project.findMany({
    where,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          logo: true,
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        take: 5,
      },
      _count: {
        select: {
          tasks: true,
          members: true,
        },
      },
      tasks: {
        select: {
          status: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return projects.map((project) => ({
    ...project,
    progress: project.tasks.length > 0
      ? Math.round(
          (project.tasks.filter((t) => t.status === "COMPLETED").length /
            project.tasks.length) *
            100
        )
      : 0,
  }));
}

async function getClients(userRole: string) {
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") {
    return prisma.client.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }
  return [];
}

async function getMembers() {
  return prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, email: true, image: true },
    orderBy: { name: "asc" },
  });
}

async function getProjectTags() {
  const projects = await prisma.project.findMany({
    select: { tags: true },
  });
  const allTags = projects.flatMap((p) => p.tags);
  return [...new Set(allTags)];
}

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const [projects, clients, members, tags] = await Promise.all([
    getProjects(session.user.id, session.user.role),
    getClients(session.user.role),
    getMembers(),
    getProjectTags(),
  ]);

  return (
    <ProjectsBoard
      initialProjects={projects}
      clients={clients}
      availableTags={tags}
      members={members}
      userRole={session.user.role}
    />
  );
}
