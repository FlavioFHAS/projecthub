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
import { noteListSelect, extractPreviewFromContent } from "@/lib/queries/section-queries";
import { userSelectMin } from "@/lib/queries/user-queries";

interface Params {
  params: { projectId: string };
}

const createNoteSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.record(z.unknown()).optional(),
  visibility: z.enum(["INTERNAL", "SHARED"]).default("INTERNAL"),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  tags: z.array(z.string().max(50)).max(10).optional(),
  folder: z.string().max(100).optional(),
  isPinned: z.boolean().default(false),
});

// GET /api/projects/[projectId]/notes - Lista notas
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
        ["createdAt", "updatedAt", "title"],
        "updatedAt",
        "desc"
      );

      // Parse filters
      const visibility = searchParams.get("visibility");
      const status = searchParams.get("status");
      const folder = searchParams.get("folder");
      const tags = searchParams.getAll("tags");
      const search = searchParams.get("search")?.trim();
      const pinned = searchParams.get("pinned");

      // Build where clause
      const where: any = {
        projectId,
        isActive: true,
      };

      // For COLLABORATOR without special permission: only SHARED + PUBLISHED
      if (user.role === "COLLABORATOR" || user.role === "CLIENT") {
        where.visibility = "SHARED";
        where.status = "PUBLISHED";
      } else {
        if (visibility) where.visibility = visibility;
        if (status) where.status = status;
      }

      if (folder) where.folder = folder;
      if (tags.length > 0) where.tags = { hasSome: tags };
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { content: { path: ["content"], string_contains: search } },
        ];
      }
      if (pinned === "true") where.isPinned = true;

      // Execute query
      const [notes, total] = await Promise.all([
        prisma.note.findMany({
          where,
          select: {
            ...noteListSelect,
            content: true, // Need content for preview
          },
          skip,
          take,
          orderBy: [{ isPinned: "desc" }, { [sortBy]: sortOrder }],
        }),
        prisma.note.count({ where }),
      ]);

      // Add preview to each note
      const notesWithPreview = notes.map((note) => ({
        ...note,
        preview: extractPreviewFromContent(note.content),
        content: undefined, // Remove full content from list
      }));

      return NextResponse.json(
        formatPaginatedResponse(notesWithPreview, total, page, pageSize),
        { status: 200 }
      );
    } catch (error) {
      console.error("[NOTES_GET]", error);
      return handlePrismaError(error);
    }
  })(req);
}

// POST /api/projects/[projectId]/notes - Cria nota
export async function POST(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canCreateNotes", async (req: NextRequest, { user }) => {
      try {
        const { projectId } = params;

        // Parse and validate body
        const bodyResult = await parseRequestBody(req, createNoteSchema);
        if ("error" in bodyResult) return bodyResult.error;

        const data = bodyResult.data;

        // Verify project exists
        const project = await prisma.project.findUnique({
          where: { id: projectId, isActive: true },
        });

        if (!project) {
          return NextResponse.json(
            { success: false, message: "Projeto não encontrado" },
            { status: 404 }
          );
        }

        // Only ADMIN/SUPER_ADMIN can create INTERNAL notes
        if (data.visibility === "INTERNAL" && user.role === "COLLABORATOR") {
          return NextResponse.json(
            {
              success: false,
              message: "Você não tem permissão para criar notas internas",
            },
            { status: 403 }
          );
        }

        // Create note
        const note = await prisma.note.create({
          data: {
            projectId,
            title: data.title,
            content: data.content || {},
            visibility: data.visibility,
            status: data.status,
            tags: data.tags || [],
            folder: data.folder,
            isPinned: data.isPinned,
            version: 1,
            authorId: user.id,
            isActive: true,
          },
          select: {
            ...noteListSelect,
            content: true,
          },
        });

        // Log audit
        await logAudit({
          action: "NOTE_CREATE",
          userId: user.id,
          targetType: "NOTE",
          targetId: note.id,
          metadata: {
            projectId,
            title: data.title,
            visibility: data.visibility,
          },
        });

        return NextResponse.json(
          {
            success: true,
            data: {
              ...note,
              preview: extractPreviewFromContent(note.content),
              content: undefined,
            },
            message: "Nota criada com sucesso",
          },
          { status: 201 }
        );
      } catch (error) {
        console.error("[NOTES_POST]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}
