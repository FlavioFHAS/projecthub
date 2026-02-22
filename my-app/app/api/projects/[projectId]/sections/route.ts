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

interface Params {
  params: { projectId: string };
}

// Schema for creating a section
const createSectionSchema = z.object({
  type: z.enum([
    "MEETINGS",
    "TASKS",
    "NOTES",
    "PROPOSALS",
    "GANTT",
    "COSTS",
    "FILES",
    "CUSTOM",
  ]),
  name: z.string().min(1).max(100),
  icon: z.string().max(50).optional(),
  visibleToRoles: z.array(z.enum(["MANAGER", "ADMIN", "MEMBER", "CLIENT"])),
});

// GET /api/projects/[projectId]/sections - Lista seções do projeto
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

      // Get user's role in project
      const member = await prisma.projectMember.findFirst({
        where: {
          projectId,
          userId: user.id,
          isActive: true,
        },
        select: { role: true },
      });

      const userProjectRole = member?.role || "CLIENT";

      const sections = await prisma.projectSection.findMany({
        where: {
          projectId,
          isActive: true,
          visibleToRoles: {
            has: userProjectRole,
          },
        },
        orderBy: { order: "asc" },
      });

      return NextResponse.json(
        { success: true, data: sections },
        { status: 200 }
      );
    } catch (error) {
      console.error("[PROJECT_SECTIONS_GET]", error);
      return handlePrismaError(error);
    }
  })(req);
}

// POST /api/projects/[projectId]/sections - Cria nova seção
export async function POST(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canEditProject", async (req: NextRequest, { user }) => {
      try {
        const { projectId } = params;

        // Parse and validate body
        const bodyResult = await parseRequestBody(req, createSectionSchema);
        if ("error" in bodyResult) return bodyResult.error;

        const data = bodyResult.data;

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

        // Get max order
        const maxOrderSection = await prisma.projectSection.findFirst({
          where: { projectId, isActive: true },
          orderBy: { order: "desc" },
          select: { order: true },
        });

        const newOrder = (maxOrderSection?.order ?? -1) + 1;

        // Create section
        const newSection = await prisma.projectSection.create({
          data: {
            projectId,
            type: data.type,
            name: data.name,
            icon: data.icon,
            order: newOrder,
            visibleToRoles: data.visibleToRoles,
            isActive: true,
          },
        });

        // Log audit
        await logAudit({
          action: "SECTION_CREATE",
          userId: user.id,
          targetType: "PROJECT_SECTION",
          targetId: newSection.id,
          metadata: {
            projectId,
            sectionType: data.type,
            sectionName: data.name,
          },
        });

        return NextResponse.json(
          {
            success: true,
            data: newSection,
            message: "Seção criada com sucesso",
          },
          { status: 201 }
        );
      } catch (error) {
        console.error("[PROJECT_SECTIONS_POST]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}
