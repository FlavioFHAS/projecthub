import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withPermission } from "@/lib/middleware";
import { handlePrismaError, logAudit } from "@/lib/api-helpers";

interface Params {
  params: { projectId: string; costId: string };
}

// POST /api/projects/[projectId]/costs/[costId]/approve
export async function POST(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canApproveCosts", async (req: NextRequest, { user }) => {
      try {
        const { projectId, costId } = params;

        // Get cost
        const cost = await prisma.costEntry.findFirst({
          where: {
            id: costId,
            projectId,
            isActive: true,
          },
        });

        if (!cost) {
          return NextResponse.json(
            { success: false, message: "Lançamento não encontrado" },
            { status: 404 }
          );
        }

        // Check if can be approved
        if (cost.status !== "PENDING") {
          return NextResponse.json(
            {
              success: false,
              message: `Não é possível aprovar um lançamento com status ${cost.status}`,
            },
            { status: 400 }
          );
        }

        // Update cost
        const updatedCost = await prisma.costEntry.update({
          where: { id: costId },
          data: {
            status: "APPROVED",
            approvedById: user.id,
            approvedAt: new Date(),
          },
          select: {
            id: true,
            description: true,
            amount: true,
            status: true,
            approvedAt: true,
          },
        });

        // Log audit
        await logAudit({
          action: "COST_STATUS_CHANGE",
          userId: user.id,
          targetType: "COST_ENTRY",
          targetId: costId,
          metadata: {
            projectId,
            oldStatus: cost.status,
            newStatus: "APPROVED",
          },
        });

        return NextResponse.json(
          {
            success: true,
            data: updatedCost,
            message: "Lançamento aprovado com sucesso",
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("[COST_APPROVE]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}
