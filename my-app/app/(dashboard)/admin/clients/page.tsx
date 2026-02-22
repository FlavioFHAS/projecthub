import { prisma } from "@/lib/prisma"
import { AdminClientsClient } from "@/components/admin/clients/AdminClientsClient"

const userSelectMin = {
  id: true,
  name: true,
  email: true,
  image: true,
}

export default async function AdminClientsPage() {
  const clients = await prisma.client.findMany({
    include: {
      admin: {
        select: userSelectMin,
      },
      projects: {
        select: {
          id: true,
          status: true,
          budget: true,
        },
      },
      _count: {
        select: { projects: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const admins = await prisma.user.findMany({
    where: {
      role: { in: ["SUPER_ADMIN", "ADMIN"] },
      isActive: true,
    },
    select: userSelectMin,
  })

  return <AdminClientsClient initialClients={clients} admins={admins} />
}
