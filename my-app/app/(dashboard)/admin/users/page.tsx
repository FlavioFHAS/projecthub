import { prisma } from "@/lib/prisma"
import { subDays } from "date-fns"
import { AdminUsersClient } from "@/components/admin/users/AdminUsersClient"

const userSelectMin = {
  id: true,
  name: true,
  email: true,
  image: true,
  role: true,
  isActive: true,
  createdAt: true,
  lastLoginAt: true,
  jobTitle: true,
}

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      ...userSelectMin,
      _count: {
        select: {
          projectMembers: true,
          createdProjects: true,
          auditLogs: {
            where: {
              createdAt: { gte: subDays(new Date(), 30) },
            },
          },
        },
      },
    },
  })

  return <AdminUsersClient initialUsers={users} />
}
