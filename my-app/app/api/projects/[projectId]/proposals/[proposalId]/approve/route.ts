import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withRole } from "@/lib/middleware";
import { handlePrismaError, logAudit } from "@/lib/api-helpers";

interface Params {
  params: { projectId: string; proposalId: string };
}

// POST /api/projects/[projectId]/proposals/[proposalId]/approve
export async function POST(req: NextRequest, { params }: Params) {
  return withAuth(
    withRole(["SUPER_ADMIN", "ADMIN"], async (req: NextRequest, { user }) => {
      try {
        const { projectId, proposalId } = params;

        // Get proposal
        const proposal = await prisma.proposal.findFirst({
          where: {
            id: proposalId,
            projectId,
            isActive: true,
          },
        });

        if (!proposal) {
          return NextResponse.json(
            { success: false, message: "Proposta não encontrada" },
            { status: 404 }
          );
        }

        // Check if proposal can be approved
        if (proposal.status !== "SENT" && proposal.status !== "NEGOTIATING") {
          return NextResponse.json(
            {
              success: false,
              message: `Não é possível aprovar uma proposta com status ${proposal.status}`,
            },
            { status: 400 }
          );
        }

        // Update proposal
        const updatedProposal = await prisma.proposal.update({
          where: { id: proposalId },
          data: {
            status: "APPROVED",
            approvedAt: new Date(),
            approvedById: user.id,
          },
          select: {
            id: true,
            code: true,
            title: true,
            status: true,
            totalValue: true,
            approvedAt: true,
          },
        });

        // Notify project members
        const projectMembers = await prisma.projectMember.findMany({
          where: { projectId, isActive: true },
          select: { userId: true },
        });

        await prisma.notification.createMany({
          data: projectMembers.map((member) => ({
            userId: member.userId,
            type: "PROPOSAL_STATUS",
            title: "Proposta aprovada",
            message: `A proposta ${proposal.code} foi aprovada`,
            link: `/projects/${projectId}/proposals/${proposalId}`,
            metadata: {
              proposalId,
              projectId,
              status: "APPROVED",
            },
          })),
        });

        // Log audit
        await logAudit({
          action: "PROPOSAL_STATUS_CHANGE",
          userId: user.id,
          targetType: "PROPOSAL",
          targetId: proposalId,
          metadata: {
            projectId,
            oldStatus: proposal.status,
            newStatus: "APPROVED",
          },
        });

        return NextResponse.json(
          {
            success: true,
            data: updatedProposal,
            message: "Proposta aprovada com sucesso",
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("[PROPOSAL_APPROVE]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}
