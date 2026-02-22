import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withPermission } from "@/lib/middleware";
import { z } from "zod";
import { parseRequestBody, handlePrismaError, logAudit } from "@/lib/api-helpers";

interface Params {
  params: { projectId: string };
}

// Schema for reordering sections
const reorderSectionsSchema = z.object({
  sectionIds: z.array(z.string().uuid()),
});

// PATCH /api/projects/[projectId]/sections/reorder - Reordena seções
export async function PATCH(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canEditProject", async (req: NextRequest, { user }) => {
      try {
        const { projectId } = params;

        // Parse and validate body
        const bodyResult = await parseRequestBody(req, reorderSectionsSchema);
        if ("error" in bodyResult) return bodyResult.error;

        const { sectionIds } = bodyResult.data;

        // Verify project exists
        const project = await prisma.project.findUnique({
          where: { id: projectId, isActive: true },
          select: { id: true },
        });

        if (!project) {
          return NextResponse.json(
            { success: false, message: "Projeto não encontrado" },
            { status: 404 }
          );
        }

        // Verify all sections belong to this project
        const sections = await prisma.projectSection.findMany({
          where: {
            id: { in: sectionIds },
            projectId,
            isActive: true,
          },
          select: { id: true },
        });

        if (sections.length !== sectionIds.length) {
          return NextResponse.json(
            {
              success: false,
              message: "Uma ou mais seções não pertencem a este projeto",
            },
            { status: 400 }
          );
        }

        // Update orders in transaction
        await prisma.$transaction(
          sectionIds.map((id, index) =>
            prisma.projectSection.update({
              where: { id },
              data: { order: index },
            })
          )
        );

        // Log audit
        await logAudit({
          action: "SECTIONS_REORDER",
          userId: user.id,
          targetType: "PROJECT",
          targetId: projectId,
          metadata: {
            sectionIds,
          },
        });

        return NextResponse.json(
          {
            success: true,
            message: "Seções reordenadas com sucesso",
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("[SECTIONS_REORDER_PATCH]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}
