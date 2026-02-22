import { prisma } from "@/lib/prisma";

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}

export async function getAllUsers() {
  return prisma.user.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getActiveUsers() {
  return prisma.user.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
  });
}

export async function updateUser(userId: string, data: any) {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
}
