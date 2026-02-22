import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { Role, ProjectStatus } from "@prisma/client"

const searchSchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().max(20).default(10),
})

interface SearchResult {
  id: string
  title: string
  subtitle?: string
  type: "project" | "task" | "client" | "user" | "note" | "meeting" | "proposal"
  href: string
  icon?: string
  status?: string
  meta?: Record<string, unknown>
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const userRole = session.user.role as Role

  try {
    const { searchParams } = new URL(req.url)
    const params = searchSchema.parse({
      q: searchParams.get("q"),
      limit: searchParams.get("limit") || "10",
    })

    const query = params.q.trim()
    const searchPattern = `%${query}%`

    // Define permissões de busca por role
    const canSearchUsers = userRole !== Role.CLIENT
    const canSearchCosts = userRole === Role.SUPER_ADMIN || userRole === Role.ADMIN
    const canSeeInternalNotes = userRole !== Role.CLIENT

    // Constrói where clause para projetos baseado na role
    const projectWhere = buildProjectWhere(userId, userRole, searchPattern)

    // Executa buscas em paralelo
    const [
      projects,
      tasks,
      clients,
      users,
      notes,
      meetings,
      proposals,
    ] = await Promise.all([
      // Projetos
      prisma.project.findMany({
        where: projectWhere,
        take: params.limit,
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          code: true,
        },
      }),

      // Tarefas
      prisma.task.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
          project: buildProjectWhere(userId, userRole),
        },
        take: params.limit,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          projectId: true,
          project: { select: { name: true } },
        },
      }),

      // Clientes (apenas para não-clientes)
      canSearchUsers
        ? prisma.client.findMany({
            where: {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
                { company: { contains: query, mode: "insensitive" } },
              ],
            },
            take: params.limit,
            select: {
              id: true,
              name: true,
              company: true,
              email: true,
            },
          })
        : Promise.resolve([]),

      // Usuários (apenas para não-clientes)
      canSearchUsers
        ? prisma.user.findMany({
            where: {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
              ],
              role: { not: Role.CLIENT },
            },
            take: params.limit,
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
            },
          })
        : Promise.resolve([]),

      // Notas
      prisma.note.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { content: { contains: query, mode: "insensitive" } },
          ],
          project: buildProjectWhere(userId, userRole),
          // Clientes não veem notas internas
          ...(userRole === Role.CLIENT && { isInternal: false }),
        },
        take: params.limit,
        select: {
          id: true,
          title: true,
          projectId: true,
          project: { select: { name: true } },
          isInternal: true,
        },
      }),

      // Reuniões
      prisma.meeting.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
          project: buildProjectWhere(userId, userRole),
        },
        take: params.limit,
        select: {
          id: true,
          title: true,
          projectId: true,
          project: { select: { name: true } },
          startTime: true,
        },
      }),

      // Propostas
      prisma.proposal.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
          project: buildProjectWhere(userId, userRole),
        },
        take: params.limit,
        select: {
          id: true,
          title: true,
          status: true,
          projectId: true,
          project: { select: { name: true } },
        },
      }),
    ])

    // Formata resultados
    const results: SearchResult[] = [
      ...projects.map((p) => ({
        id: p.id,
        title: p.name,
        subtitle: p.description || undefined,
        type: "project" as const,
        href: `/projects/${p.id}`,
        icon: "Folder",
        status: p.status,
        meta: { code: p.code },
      })),

      ...tasks.map((t) => ({
        id: t.id,
        title: t.title,
        subtitle: t.project.name,
        type: "task" as const,
        href: `/projects/${t.projectId}/tasks?task=${t.id}`,
        icon: "CheckSquare",
        status: t.status,
        meta: { priority: t.priority },
      })),

      ...clients.map((c) => ({
        id: c.id,
        title: c.name,
        subtitle: c.company || c.email,
        type: "client" as const,
        href: `/clients/${c.id}`,
        icon: "Building2",
      })),

      ...users.map((u) => ({
        id: u.id,
        title: u.name || u.email,
        subtitle: u.email,
        type: "user" as const,
        href: `/team/${u.id}`,
        icon: "User",
        meta: { role: u.role, image: u.image },
      })),

      ...notes.map((n) => ({
        id: n.id,
        title: n.title,
        subtitle: n.project.name,
        type: "note" as const,
        href: `/projects/${n.projectId}/notes?id=${n.id}`,
        icon: "FileText",
        meta: { isInternal: n.isInternal },
      })),

      ...meetings.map((m) => ({
        id: m.id,
        title: m.title,
        subtitle: m.project.name,
        type: "meeting" as const,
        href: `/projects/${m.projectId}/meetings?id=${m.id}`,
        icon: "Video",
        meta: { startTime: m.startTime },
      })),

      ...proposals.map((p) => ({
        id: p.id,
        title: p.title,
        subtitle: p.project.name,
        type: "proposal" as const,
        href: `/projects/${p.projectId}/proposals?id=${p.id}`,
        icon: "FileCheck",
        status: p.status,
      })),
    ]

    // Ordena por relevância (título começa com a query primeiro)
    const sortedResults = results.sort((a, b) => {
      const aStartsWith = a.title.toLowerCase().startsWith(query.toLowerCase())
      const bStartsWith = b.title.toLowerCase().startsWith(query.toLowerCase())
      if (aStartsWith && !bStartsWith) return -1
      if (!aStartsWith && bStartsWith) return 1
      return a.title.localeCompare(b.title)
    })

    // Limita resultados totais
    const limitedResults = sortedResults.slice(0, params.limit * 2)

    return Response.json({
      results: limitedResults,
      query,
      total: limitedResults.length,
      categories: {
        projects: projects.length,
        tasks: tasks.length,
        clients: clients.length,
        users: users.length,
        notes: notes.length,
        meetings: meetings.length,
        proposals: proposals.length,
      },
    })
  } catch (error) {
    console.error("Erro na busca:", error)
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid search parameters", details: error.errors },
        { status: 400 }
      )
    }
    return Response.json(
      { error: "Search failed" },
      { status: 500 }
    )
  }
}

// Helper para construir where clause de projetos baseado na role
function buildProjectWhere(
  userId: string,
  role: Role,
  searchPattern?: string
) {
  const baseWhere: Record<string, unknown> = {}

  if (searchPattern) {
    baseWhere.OR = [
      { name: { contains: searchPattern.replace(/%/g, ""), mode: "insensitive" } },
      { description: { contains: searchPattern.replace(/%/g, ""), mode: "insensitive" } },
      { code: { contains: searchPattern.replace(/%/g, ""), mode: "insensitive" } },
    ]
  }

  // Super Admin vê todos os projetos
  if (role === Role.SUPER_ADMIN) {
    return baseWhere
  }

  // Admin vê todos os projetos ativos
  if (role === Role.ADMIN) {
    return {
      ...baseWhere,
      status: { not: ProjectStatus.ARCHIVED },
    }
  }

  // Collaborator e Client veem apenas projetos onde são membros
  return {
    ...baseWhere,
    members: {
      some: {
        userId,
      },
    },
  }
}
