import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";
import { GanttClient } from "@/components/gantt/GanttClient";
import { PageHeader } from "@/components/shared/PageHeader";

interface GanttPageProps {
  params: { projectId: string };
}

async function getProject(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      ganttItems: {
        orderBy: { startDate: "asc" },
      },
    },
  });

  return project;
}

async function checkPermissions(projectId: string, userId: string) {
  const member = await prisma.projectMember.findFirst({
    where: {
      projectId,
      userId,
    },
  });

  return member !== null;
}

export async function generateMetadata({ params }: GanttPageProps): Promise<Metadata> {
  const project = await getProject(params.projectId);
  
  if (!project) {
    return { title: "Projeto não encontrado" };
  }

  return {
    title: `Cronograma - ${project.name}`,
    description: `Diagrama de Gantt do projeto ${project.name}`,
  };
}

export default async function GanttPage({ params }: GanttPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const hasAccess = await checkPermissions(params.projectId, session.user.id);

  if (!hasAccess) {
    notFound();
  }

  const project = await getProject(params.projectId);

  if (!project) {
    notFound();
  }

  const serializedItems = project.ganttItems.map((item) => ({
    ...item,
    startDate: new Date(item.startDate),
    endDate: new Date(item.endDate),
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cronograma"
        description="Diagrama de Gantt interativo para visualização e controle do cronograma do projeto."
      />

      <div className="h-[calc(100vh-280px)] min-h-[500px]">
        <GanttClient initialItems={serializedItems} />
      </div>
    </div>
  );
}
