import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withPermission } from "@/lib/middleware";
import { z } from "zod";
import { parseRequestBody, handlePrismaError, logAudit } from "@/lib/api-helpers";
import { ganttItemInclude } from "@/lib/queries/section-queries";

interface Params {
  params: { projectId: string };
}

const bulkUpdateSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      order: z.number().int().optional(),
      parentId: z.string().uuid().optional().nullable(),
      progress: z.number().int().min(0).max(100).optional(),
    })
  ),
});

// PATCH /api/projects/[projectId]/gantt/bulk-update
export async function PATCH(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canManageGantt", async (req: NextRequest, { user }) => {
      try {
        const { projectId } = params;

        // Parse and validate body
        const bodyResult = await parseRequestBody(req, bulkUpdateSchema);
        if ("error" in bodyResult) return bodyResult.error;

        const { items } = bodyResult.data;

        // Verify all items belong to this project
        const itemIds = items.map((i) => i.id);
        const validItems = await prisma.ganttItem.findMany({
          where: {
            id: { in: itemIds },
            projectId,
            isActive: true,
          },
          select: { id: true },
        });

        const validItemIds = new Set(validItems.map((i) => i.id));
        const invalidIds = itemIds.filter((id) => !validItemIds.has(id));

        if (invalidIds.length > 0) {
          return NextResponse.json(
            {
              success: false,
              message: "Alguns itens não pertencem a este projeto",
              errors: { items: [`IDs inválidos: ${invalidIds.join(", ")}`] },
            },
            { status: 400 }
          );
        }

        // Update all items in transaction
        const updatedItems = await prisma.$transaction(async (tx) => {
          const results = [];

          for (const item of items) {
            const updateData: any = {};

            if (item.startDate) updateData.startDate = new Date(item.startDate);
            if (item.endDate) updateData.endDate = new Date(item.endDate);
            if (item.order !== undefined) updateData.order = item.order;
            if (item.parentId !== undefined) updateData.parentId = item.parentId;
            if (item.progress !== undefined) updateData.progress = item.progress;

            const updated = await tx.ganttItem.update({
              where: { id: item.id },
              data: updateData,
              include: ganttItemInclude,
            });

            results.push(updated);
          }

          return results;
        });

        // Log audit
        await logAudit({
          action: "GANTT_BULK_UPDATE",
          userId: user.id,
          targetType: "PROJECT",
          targetId: projectId,
          metadata: {
            itemsUpdated: items.length,
            itemIds,
          },
        });

        return NextResponse.json(
          {
            success: true,
            data: updatedItems,
            message: `${items.length} item(s) atualizado(s) com sucesso`,
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("[GANTT_BULK_UPDATE]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}
