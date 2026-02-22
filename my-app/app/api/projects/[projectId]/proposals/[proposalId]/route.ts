import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withPermission } from "@/lib/middleware";
import { z } from "zod";
import {
  parseRequestBody,
  handlePrismaError,
  logAudit,
  verifyProjectAccess,
} from "@/lib/api-helpers";
import { proposalFullSelect } from "@/lib/queries/section-queries";

interface Params {
  params: { projectId: string; proposalId: string };
}

const proposalItemSchema = z.object({
  description: z.string(),
  category: z.string().optional(),
  quantity: z.number().positive(),
  unitValue: z.number().positive(),
});

const updateProposalSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  status: z.enum(["DRAFT", "SENT", "NEGOTIATING", "APPROVED", "REJECTED", "EXPIRED"]).optional(),
  scope: z.record(z.unknown()).optional(),
  items: z.array(proposalItemSchema).optional(),
  paymentTerms: z.string().optional(),
  internalNotes: z.record(z.unknown()).optional(),
  validUntil: z.string().datetime().optional(),
  isVisibleToClient: z.boolean().optional(),
});

// GET /api/projects/[projectId]/proposals/[proposalId]
export async function GET(req: NextRequest, { params }: Params) {
  return withAuth(async (req: NextRequest, { user }) => {
    try {
      const { projectId, proposalId } = params;

      // Check permissions
      const hasAccess = await verifyProjectAccess(projectId, user.id, user.role);
      if (!hasAccess) {
        return NextResponse.json(
          {
            success: false,
            message: "Você não tem permissão para visualizar este projeto",
          },
          { status: 403 }
        );
      }

      const proposal = await prisma.proposal.findFirst({
        where: {
          id: proposalId,
          projectId,
          isActive: true,
        },
        select:
          user.role === "CLIENT"
            ? {
                id: true,
                code: true,
                version: true,
                title: true,
                status: true,
                totalValue: true,
                scope: true,
                validUntil: true,
                createdAt: true,
              }
            : proposalFullSelect,
      });

      if (!proposal) {
        return NextResponse.json(
          { success: false, message: "Proposta não encontrada" },
          { status: 404 }
        );
      }

      // For CLIENT: check visibility
      if (user.role === "CLIENT") {
        const fullProposal = await prisma.proposal.findFirst({
          where: { id: proposalId },
          select: { isVisibleToClient: true, status: true },
        });

        if (!fullProposal?.isVisibleToClient || fullProposal.status !== "APPROVED") {
          return NextResponse.json(
            {
              success: false,
              message: "Você não tem permissão para visualizar esta proposta",
            },
            { status: 403 }
          );
        }
      }

      return NextResponse.json(
        { success: true, data: proposal },
        { status: 200 }
      );
    } catch (error) {
      console.error("[PROPOSAL_GET]", error);
      return handlePrismaError(error);
    }
  })(req);
}

// PATCH /api/projects/[projectId]/proposals/[proposalId]
export async function PATCH(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canManageProposals", async (req: NextRequest, { user }) => {
      try {
        const { projectId, proposalId } = params;

        // Parse and validate body
        const bodyResult = await parseRequestBody(req, updateProposalSchema);
        if ("error" in bodyResult) return bodyResult.error;

        const data = bodyResult.data;

        // Get existing proposal
        const existingProposal = await prisma.proposal.findFirst({
          where: {
            id: proposalId,
            projectId,
            isActive: true,
          },
        });

        if (!existingProposal) {
          return NextResponse.json(
            { success: false, message: "Proposta não encontrada" },
            { status: 404 }
          );
        }

        // Calculate total value if items updated
        let totalValue = existingProposal.totalValue;
        if (data.items) {
          totalValue = data.items.reduce(
            (sum, item) => sum + item.quantity * item.unitValue,
            0
          );
        }

        // Check if status is changing to APPROVED
        const isApproving = data.status === "APPROVED" && existingProposal.status !== "APPROVED";

        // Update proposal
        const updatedProposal = await prisma.proposal.update({
          where: { id: proposalId },
          data: {
            ...(data.title && { title: data.title }),
            ...(data.status && { status: data.status }),
            ...(data.scope && { scope: data.scope }),
            ...(data.items && { items: data.items }),
            ...(data.paymentTerms !== undefined && { paymentTerms: data.paymentTerms }),
            ...(data.internalNotes && { internalNotes: data.internalNotes }),
            ...(data.validUntil !== undefined && {
              validUntil: data.validUntil ? new Date(data.validUntil) : null,
            }),
            ...(data.isVisibleToClient !== undefined && {
              isVisibleToClient: data.isVisibleToClient,
            }),
            ...(data.items && { totalValue }),
            ...(isApproving && {
              approvedAt: new Date(),
              approvedById: user.id,
            }),
          },
          select: proposalFullSelect,
        });

        // Notify if approved
        if (isApproving) {
          const projectMembers = await prisma.projectMember.findMany({
            where: { projectId, isActive: true },
            select: { userId: true },
          });

          prisma.notification
            .createMany({
              data: projectMembers.map((member) => ({
                userId: member.userId,
                type: "PROPOSAL_STATUS",
                title: "Proposta aprovada",
                message: `A proposta ${existingProposal.code} foi aprovada`,
                link: `/projects/${projectId}/proposals/${proposalId}`,
                metadata: {
                  proposalId,
                  projectId,
                  status: "APPROVED",
                },
              })),
            })
            .catch(console.error);
        }

        // Log audit
        await logAudit({
          action: "PROPOSAL_UPDATE",
          userId: user.id,
          targetType: "PROPOSAL",
          targetId: proposalId,
          metadata: {
            projectId,
            updatedFields: Object.keys(data),
            statusChanged: data.status !== undefined,
            oldStatus: existingProposal.status,
            newStatus: data.status,
          },
        });

        return NextResponse.json(
          {
            success: true,
            data: updatedProposal,
            message: "Proposta atualizada com sucesso",
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("[PROPOSAL_PATCH]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}

// DELETE /api/projects/[projectId]/proposals/[proposalId]
export async function DELETE(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canManageProposals", async (req: NextRequest, { user }) => {
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

        // Only allow deletion of DRAFT or REJECTED proposals
        if (proposal.status === "APPROVED" || proposal.status === "SENT") {
          return NextResponse.json(
            {
              success: false,
              message: `Não é possível deletar uma proposta com status ${proposal.status}`,
            },
            { status: 409 }
          );
        }

        // Soft delete
        await prisma.proposal.update({
          where: { id: proposalId },
          data: { isActive: false },
        });

        // Log audit
        await logAudit({
          action: "PROPOSAL_DELETE",
          userId: user.id,
          targetType: "PROPOSAL",
          targetId: proposalId,
          metadata: {
            projectId,
            code: proposal.code,
            status: proposal.status,
          },
        });

        return NextResponse.json(
          {
            success: true,
            message: "Proposta removida com sucesso",
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("[PROPOSAL_DELETE]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}
