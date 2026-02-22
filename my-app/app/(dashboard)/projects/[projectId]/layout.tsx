import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyProjectAccess } from "@/lib/permissions";
import { ProjectLayoutClient } from "@/components/project/ProjectLayoutClient";

interface Props {
  children: React.ReactNode;
  params: { projectId: string };
}

export async function generateMetadata({ params }: Props) {
  const project = await prisma.project.findUnique({
    where: { id: params.projectId },
    select: { name: true, client: { select: { name: true } } },
  });
  if (!project) return { title: "Projeto não encontrado" };
  return {
    title: `${project.name} | ${project.client?.name || "Sem cliente"} | ProjectHub`,
    description: `Gerenciamento do projeto ${project.name}`,
  };
}

export default async function ProjectLayout({ children, params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  // Buscar projeto completo
  const project = await prisma.project.findUnique({
    where: { id: params.projectId },
    include: {
      client: {
        select: { id: true, name: true, logo: true },
      },
      members: {
        where: {},
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              image: true,
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      sections: {
        where: {},
        orderBy: { order: "asc" },
      },
      _count: {
        select: {
          tasks: { where: { status: { not: "COMPLETED" } } },
          meetings: true,
          notes: true,
        },
      },
    },
  });

  if (!project) notFound();

  // Verificar acesso ao projeto
  const hasAccess = await verifyProjectAccess(
    params.projectId,
    session.user.id,
    session.user.role
  );
  if (!hasAccess) redirect("/projects");

  // Buscar membro atual para customPermissions
  const currentMember = project.members.find(
    (m) => m.userId === session.user.id
  );

  // Filtrar seções visíveis para o role do usuário
  const visibleSections = project.sections.filter((section) => {
    const roles = (section as any).visibleToRoles as string[] || ["SUPER_ADMIN", "ADMIN", "COLLABORATOR", "CLIENT"];
    return roles.includes(session.user.role);
  });

  return (
    <ProjectLayoutClient
      project={project as any}
      visibleSections={visibleSections as any}
      currentMember={currentMember as any}
      userRole={session.user.role}
      userId={session.user.id}
    >
      {children}
    </ProjectLayoutClient>
  );
}
