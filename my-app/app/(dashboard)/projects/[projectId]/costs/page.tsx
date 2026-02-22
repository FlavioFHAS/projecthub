import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";
import { CostsClient } from "@/components/costs/CostsClient";
import { PageHeader } from "@/components/shared/PageHeader";

interface CostsPageProps {
  params: { projectId: string };
}

async function getProject(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      costEntries: {
        orderBy: { date: "desc" },
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

export async function generateMetadata({ params }: CostsPageProps): Promise<Metadata> {
  const project = await getProject(params.projectId);
  
  if (!project) {
    return { title: "Projeto não encontrado" };
  }

  return {
    title: `Custos - ${project.name}`,
    description: `Controle de custos do projeto ${project.name}`,
  };
}

export default async function CostsPage({ params }: CostsPageProps) {
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

  const serializedEntries = project.costEntries.map((entry) => ({
    ...entry,
    date: new Date(entry.date),
    createdAt: new Date(entry.createdAt),
    updatedAt: new Date(entry.updatedAt),
  }));

  const budget = project.budget || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Controle de Custos"
        description="Gerencie os custos do projeto, acompanhe o orçamento e visualize relatórios financeiros."
      />

      <CostsClient initialEntries={serializedEntries} budget={budget} />
    </div>
  );
}
