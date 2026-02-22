import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withRole } from "@/lib/middleware";
import { projectSchema } from "@/lib/validations";
import {
  parsePaginationParams,
  parseSortParams,
  formatPaginatedResponse,
  parseRequestBody,
  handlePrismaError,
  logAudit,
} from "@/lib/api-helpers";
import {
  projectListInclude,
  createDefaultProjectSections,
  createDefaultKanbanColumns,
} from "@/lib/queries/project-queries";

// GET /api/projects - Lista projetos com paginação e filtros
export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(req.url);

    // Parse pagination
    const { page, pageSize, skip, take } = parsePaginationParams(searchParams);

    // Parse sorting
    const { sortBy, sortOrder } = parseSortParams(
      searchParams,
      ["name", "status", "startDate", "endDate", "createdAt", "updatedAt"],
      "createdAt",
      "desc"
    );

    // Parse filters
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const managerId = searchParams.get("managerId");
    const search = searchParams.get("search")?.trim();
    const isActive = searchParams.get("isActive");

    // Build where clause
    const where: any = {};

    if (isActive !== null) {
      where.isActive = isActive === "true";
    } else {
      where.isActive = true;
    }

    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (managerId) where.managerId = managerId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Permission filtering
    if (user.role === "CLIENT") {
      // CLIENT can only see their own projects
      const clientUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { clientId: true },
      });
      where.clientId = clientUser?.clientId;
    } else if (user.role === "COLLABORATOR") {
      // COLLABORATOR can only see projects they are members of
      where.members = {
        some: {
          userId: user.id,
          isActive: true,
        },
      };
    }

    // Execute query
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: projectListInclude,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.project.count({ where }),
    ]);

    return NextResponse.json(
      formatPaginatedResponse(projects, total, page, pageSize),
      { status: 200 }
    );
  } catch (error) {
    console.error("[PROJECTS_GET]", error);
    return handlePrismaError(error);
  }
});

// POST /api/projects - Cria novo projeto
export const POST = withAuth(
  withRole(["SUPER_ADMIN", "ADMIN", "COLLABORATOR"], async (req: NextRequest, { user }) => {
    try {
      // Parse and validate body
      const bodyResult = await parseRequestBody(req, projectSchema);
      if ("error" in bodyResult) return bodyResult.error;

      const data = bodyResult.data;

      // Verify client exists
      const client = await prisma.client.findUnique({
        where: { id: data.clientId, isActive: true },
      });

      if (!client) {
        return NextResponse.json(
          {
            success: false,
            message: "Cliente não encontrado",
            errors: { clientId: ["Cliente não existe ou está inativo"] },
          },
          { status: 404 }
        );
      }

      // Verify manager exists and is active
      const manager = await prisma.user.findUnique({
        where: { id: data.managerId, isActive: true },
      });

      if (!manager) {
        return NextResponse.json(
          {
            success: false,
            message: "Gerente não encontrado",
            errors: { managerId: ["Gerente não existe ou está inativo"] },
          },
          { status: 404 }
        );
      }

      // Create project with transaction
      const newProject = await prisma.$transaction(async (tx) => {
        // Create project
        const project = await tx.project.create({
          data: {
            name: data.name,
            description: data.description,
            status: data.status,
            startDate: data.startDate ? new Date(data.startDate) : null,
            endDate: data.endDate ? new Date(data.endDate) : null,
            budget: data.budget || 0,
            clientId: data.clientId,
            managerId: data.managerId,
            color: data.color || "#3b82f6",
            tags: data.tags || [],
            isActive: true,
          },
          include: projectListInclude,
        });

        // Add manager as project member with MANAGER role
        await tx.projectMember.create({
          data: {
            projectId: project.id,
            userId: data.managerId,
            role: "MANAGER",
            isActive: true,
          },
        });

        // Add creator as project member with ADMIN role (if not the manager)
        if (user.id !== data.managerId) {
          await tx.projectMember.create({
            data: {
              projectId: project.id,
              userId: user.id,
              role: "ADMIN",
              isActive: true,
            },
          });
        }

        // Create default sections
        await createDefaultProjectSections(project.id);

        // Create default kanban columns
        await createDefaultKanbanColumns(project.id);

        return project;
      });

      // Log audit
      await logAudit({
        action: "PROJECT_CREATE",
        userId: user.id,
        targetType: "PROJECT",
        targetId: newProject.id,
        metadata: {
          projectName: data.name,
          clientId: data.clientId,
          managerId: data.managerId,
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: newProject,
          message: "Projeto criado com sucesso",
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("[PROJECTS_POST]", error);
      return handlePrismaError(error);
    }
  })
);
