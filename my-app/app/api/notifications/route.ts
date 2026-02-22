import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const querySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().max(50).default(20),
  unreadOnly: z.coerce.boolean().default(false),
})

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const params = querySchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      unreadOnly: searchParams.get("unreadOnly") === "true",
    })

    const skip = (params.page - 1) * params.limit

    const where = {
      userId: session.user.id,
      ...(params.unreadOnly && { read: false }),
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: params.limit,
        skip,
        include: {
          actor: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      }),
      prisma.notification.count({ where: { userId: session.user.id } }),
      prisma.notification.count({
        where: { userId: session.user.id, read: false },
      }),
    ])

    return Response.json({
      notifications,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
      unreadCount,
    })
  } catch (error) {
    console.error("Erro ao buscar notificações:", error)
    return Response.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}
