import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withRole } from "@/lib/middleware";
import {
  parsePaginationParams,
  parseSortParams,
  formatPaginatedResponse,
  handlePrismaError,
} from "@/lib/api-helpers";
import { auditLogSelect } from "@/lib/queries/section-queries";

// GET /api/audit - Lista logs de auditoria
export const GET = withAuth(
  withRole(["SUPER_ADMIN", "ADMIN"], async (req: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(req.url);

      // Parse pagination
      const { page, pageSize, skip, take } = parsePaginationParams(searchParams);

      // Parse sorting
      const { sortBy, sortOrder } = parseSortParams(
        searchParams,
        ["createdAt"],
        "createdAt",
        "desc"
      );

      // Parse filters
      const projectId = searchParams.get("projectId");
      const userId = searchParams.get("userId");
      const action = searchParams.get("action");
      const entity = searchParams.get("entity");
      const from = searchParams.get("from");
      const to = searchParams.get("to");

      // Build where clause
      const where: any = {};

      // ADMIN can only see logs from their projects
      if (user.role === "ADMIN") {
        const userProjectIds = await prisma.projectMember.findMany({
          where: {
            userId: user.id,
            isActive: true,
          },
          select: { projectId: true },
        });

        where.OR = [
          { projectId: { in: userProjectIds.map((p) => p.projectId) } },
          { projectId: null },
        ];
      }

      if (projectId) where.projectId = projectId;
      if (userId) where.userId = userId;
      if (action) where.action = action;
      if (entity) where.entityType = entity;
      if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(from);
        if (to) where.createdAt.lte = new Date(to);
      }

      // Execute query
      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          select: auditLogSelect,
          skip,
          take,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.auditLog.count({ where }),
      ]);

      return NextResponse.json(
        formatPaginatedResponse(logs, total, page, pageSize),
        { status: 200 }
      );
    } catch (error) {
      console.error("[AUDIT_GET]", error);
      return handlePrismaError(error);
    }
  })
);
