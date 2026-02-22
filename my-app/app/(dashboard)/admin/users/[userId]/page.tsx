import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UserDetailClient } from "@/components/admin/users/UserDetailClient"

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
  bio: true,
}

interface UserDetailPageProps {
  params: {
    userId: string
  }
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      ...userSelectMin,
      projectMembers: {
        include: {
          project: {
            select: {
              id: true,
              name: true,
              status: true,
              color: true,
            },
          },
        },
      },
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          projectMembers: true,
          createdProjects: true,
          tasks: {
            where: {
              status: "DONE",
            },
          },
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  return <UserDetailClient user={user} />
}
