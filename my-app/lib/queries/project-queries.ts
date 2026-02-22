import { prisma } from "@/lib/prisma";

export async function getProjectsByClientId(clientId: string) {
  return prisma.project.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProjectById(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      client: true,
      members: true,
    },
  });
}

export async function createProject(data: {
  name: string;
  description?: string;
  clientId: string;
  status?: string;
}) {
  return prisma.project.create({ data });
}

export async function updateProject(projectId: string, data: any) {
  return prisma.project.update({
    where: { id: projectId },
    data,
  });
}

export async function deleteProject(projectId: string) {
  return prisma.project.delete({
    where: { id: projectId },
  });
}
