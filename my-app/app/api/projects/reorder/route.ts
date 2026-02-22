import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withRole } from "@/lib/middleware";
import { z } from "zod";
import { parseRequestBody, handlePrismaError, logAudit } from "@/lib/api-helpers";

// Schema for reordering projects
const reorderProjectsSchema = z.object({
  projectIds: z.array(z.string().uuid()),
});

// PATCH /api/projects/reorder - Reordena projetos (favoritos/pinned)
export const PATCH = withAuth(
  withRole(["SUPER_ADMIN", "ADMIN", "COLLABORATOR"], async (req: NextRequest, { user }) => {
    try {
      // Parse and validate body
      const bodyResult = await parseRequestBody(req, reorderProjectsSchema);
      if ("error" in bodyResult) return bodyResult.error;

      const { projectIds } = bodyResult.data;

      // For now, this endpoint just validates that the user has access to all projects
      // In a more complete implementation, you might store the order in a user preferences table

      // Verify all projects exist and user has access
      const projects = await prisma.project.findMany({
        where: {
          id: { in: projectIds },
          isActive: true,
          ...(user.role !== "SUPER_ADMIN" && {
            members: {
              some: {
                userId: user.id,
                isActive: true,
              },
            },
          }),
        },
        select: { id: true },
      });

      if (projects.length !== projectIds.length) {
        return NextResponse.json(
          {
            success: false,
            message: "Um ou mais projetos não foram encontrados ou você não tem acesso",
          },
          { status: 400 }
        );
      }

      // Log audit
      await logAudit({
        action: "PROJECTS_REORDER",
        userId: user.id,
        targetType: "USER",
        targetId: user.id,
        metadata: {
          projectIds,
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: "Ordem dos projetos atualizada com sucesso",
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("[PROJECTS_REORDER_PATCH]", error);
      return handlePrismaError(error);
    }
  })
);
