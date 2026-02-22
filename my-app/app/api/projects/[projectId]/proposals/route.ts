import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withPermission } from "@/lib/middleware";
import { z } from "zod";
import {
  parsePaginationParams,
  parseSortParams,
  formatPaginatedResponse,
  parseRequestBody,
  handlePrismaError,
  logAudit,
  verifyProjectAccess,
} from "@/lib/api-helpers";
import { proposalListSelect, proposalFullSelect } from "@/lib/queries/section-queries";

interface Params {
  params: { projectId: string };
}

const proposalItemSchema = z.object({
  description: z.string().min(1),
  category: z.string().optional(),
  quantity: z.number().positive(),
  unitValue: z.number().positive(),
});

const createProposalSchema = z.object({
  title: z.string().min(2).max(200),
  scope: z.record(z.unknown()).optional(),
  items: z.array(proposalItemSchema).optional(),
  paymentTerms: z.string().max(500).optional(),
  internalNotes: z.record(z.unknown()).optional(),
  validUntil: z.string().datetime().optional(),
  isVisibleToClient: z.boolean().default(false),
  parentProposalId: z.string().uuid().optional(),
});

// GET /api/projects/[projectId]/proposals - Lista propostas
export async function GET(req: NextRequest, { params }: Params) {
  return withAuth(async (req: NextRequest, { user }) => {
    try {
      const { projectId } = params;

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

      const { searchParams } = new URL(req.url);

      // Parse pagination
      const { page, pageSize, skip, take } = parsePaginationParams(searchParams);

      // Parse sorting
      const { sortBy, sortOrder } = parseSortParams(
        searchParams,
        ["createdAt", "title", "status", "totalValue"],
        "createdAt",
        "desc"
      );

      // Parse filters
      const status = searchParams.get("status");
      const version = searchParams.get("version");

      // Build where clause
      const where: any = {
        projectId,
        isActive: true,
      };

      // For CLIENT: only show approved and visible proposals
      if (user.role === "CLIENT") {
        where.status = "APPROVED";
        where.isVisibleToClient = true;
      }

      if (status) where.status = status;
      if (version) where.version = parseInt(version);

      // Execute query
      const [proposals, total] = await Promise.all([
        prisma.proposal.findMany({
          where,
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
              : proposalListSelect,
          skip,
          take,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.proposal.count({ where }),
      ]);

      return NextResponse.json(
        formatPaginatedResponse(proposals, total, page, pageSize),
        { status: 200 }
      );
    } catch (error) {
      console.error("[PROPOSALS_GET]", error);
      return handlePrismaError(error);
    }
  })(req);
}

// POST /api/projects/[projectId]/proposals - Cria proposta
export async function POST(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canManageProposals", async (req: NextRequest, { user }) => {
      try {
        const { projectId } = params;

        // Parse and validate body
        const bodyResult = await parseRequestBody(req, createProposalSchema);
        if ("error" in bodyResult) return bodyResult.error;

        const data = bodyResult.data;

        // Get project with client info
        const project = await prisma.project.findUnique({
          where: { id: projectId, isActive: true },
          include: {
            client: {
              select: { name: true },
            },
          },
        });

        if (!project) {
          return NextResponse.json(
            { success: false, message: "Projeto não encontrado" },
            { status: 404 }
          );
        }

        let version = 1;
        let parentProposal: any = null;

        // If parentProposalId provided, create new version
        if (data.parentProposalId) {
          parentProposal = await prisma.proposal.findFirst({
            where: {
              id: data.parentProposalId,
              projectId,
              isActive: true,
            },
          });

          if (!parentProposal) {
            return NextResponse.json(
              {
                success: false,
                message: "Proposta base não encontrada",
              },
              { status: 404 }
            );
          }

          version = parentProposal.version + 1;
        }

        // Generate proposal code
        const clientPrefix = project.client.name
          .replace(/[^a-zA-Z]/g, "")
          .slice(0, 3)
          .toUpperCase();

        const lastProposal = await prisma.proposal.findFirst({
          where: {
            code: {
              startsWith: `PROP-${clientPrefix}`,
            },
          },
          orderBy: { createdAt: "desc" },
          select: { code: true },
        });

        let sequence = 1;
        if (lastProposal) {
          const match = lastProposal.code.match(/-(\d+)$/);
          if (match) {
            sequence = parseInt(match[1]) + 1;
          }
        }

        const code = `PROP-${clientPrefix}-${sequence.toString().padStart(3, "0")}`;

        // Calculate total value from items
        const totalValue =
          data.items?.reduce((sum, item) => sum + item.quantity * item.unitValue, 0) || 0;

        // Create proposal
        const proposal = await prisma.proposal.create({
          data: {
            projectId,
            code,
            version,
            title: data.title,
            scope: data.scope || {},
            items: data.items || [],
            paymentTerms: data.paymentTerms,
            internalNotes: data.internalNotes,
            totalValue,
            validUntil: data.validUntil ? new Date(data.validUntil) : null,
            isVisibleToClient: data.isVisibleToClient,
            status: "DRAFT",
            parentProposalId: data.parentProposalId || null,
            createdById: user.id,
            isActive: true,
          },
          select: proposalFullSelect,
        });

        // Log audit
        await logAudit({
          action: "PROPOSAL_CREATE",
          userId: user.id,
          targetType: "PROPOSAL",
          targetId: proposal.id,
          metadata: {
            projectId,
            code,
            version,
            totalValue,
          },
        });

        return NextResponse.json(
          {
            success: true,
            data: proposal,
            message: "Proposta criada com sucesso",
          },
          { status: 201 }
        );
      } catch (error) {
        console.error("[PROPOSALS_POST]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}
