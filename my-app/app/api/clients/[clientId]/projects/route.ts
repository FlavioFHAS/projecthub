import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware";
import {
  parsePaginationParams,
  parseSortParams,
  formatPaginatedResponse,
  handlePrismaError,
  verifyClientAccess,
} from "@/lib/api-helpers";
import { projectListInclude } from "@/lib/queries/project-queries";

interface Params {
  params: { clientId: string };
}

// GET /api/clients/[clientId]/projects - Lista projetos de um cliente
export async function GET(req: NextRequest, { params }: Params) {
  return withAuth(async (req: NextRequest, { user }) => {
    try {
      const { clientId } = params;

      // Check permissions
      const hasAccess = await verifyClientAccess(clientId, user.id, user.role);
      if (!hasAccess) {
        return NextResponse.json(
          {
            success: false,
            message: "Você não tem permissão para visualizar os projetos deste cliente",
          },
          { status: 403 }
        );
      }

      const { searchParams } = new URL(req.url);

      // Parse pagination
      const { page, pageSize, skip, take } = parsePaginationParams(searchParams);

      // Parse sorting
      const { sortBy, sortOrder } = parseSortParams(
        searchParams,
        ["name", "status", "startDate", "endDate", "createdAt"],
        "createdAt",
        "desc"
      );

      // Parse filters
      const status = searchParams.get("status");
      const search = searchParams.get("search")?.trim();

      // Build where clause
      const where: any = {
        clientId,
        isActive: true,
      };

      if (status) where.status = status;
      if (search) {
        where.name = { contains: search, mode: "insensitive" };
      }

      // For non-admin users, only show projects they are members of
      if (user.role === "COLLABORATOR" || user.role === "CLIENT") {
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
      console.error("[CLIENT_PROJECTS_GET]", error);
      return handlePrismaError(error);
    }
  })(req);
}
