import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"
import { AuditLogClient } from "@/components/admin/audit/AuditLogClient"

const userSelectMin = {
  id: true,
  name: true,
  email: true,
  image: true,
}

export default async function AdminAuditPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return null
  }

  const isSuperAdmin = session.user.role === Role.SUPER_ADMIN

  // SUPER_ADMIN: todos os logs
  // ADMIN: apenas logs dos seus projetos
  const whereClause = isSuperAdmin
    ? {}
    : {
        project: {
          OR: [
            { createdById: session.user.id },
            {
              members: {
                some: { userId: session.user.id, role: "ADMIN" },
              },
            },
          ],
        },
      }

  const [auditLogs, totalCount, users, projects] = await Promise.all([
    prisma.auditLog.findMany({
      where: whereClause,
      include: {
        user: { select: userSelectMin },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.auditLog.count({ where: whereClause }),
    prisma.user.findMany({
      select: userSelectMin,
      orderBy: { name: "asc" },
    }),
    isSuperAdmin
      ? prisma.project.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : prisma.project.findMany({
          where: {
            OR: [
              { createdById: session.user.id },
              {
                members: {
                  some: { userId: session.user.id, role: "ADMIN" },
                },
              },
            ],
          },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
  ])

  return (
    <AuditLogClient
      initialLogs={auditLogs}
      totalCount={totalCount}
      isSuperAdmin={isSuperAdmin}
      users={users}
      projects={projects}
    />
  )
}
