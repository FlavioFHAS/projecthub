import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withPermission } from "@/lib/middleware";
import { z } from "zod";
import {
  parseRequestBody,
  handlePrismaError,
  logAudit,
} from "@/lib/api-helpers";
import { noteFullSelect } from "@/lib/queries/section-queries";

interface Params {
  params: { projectId: string; noteId: string };
}

const updateNoteSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  content: z.record(z.unknown()).optional(),
  visibility: z.enum(["INTERNAL", "SHARED"]).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  tags: z.array(z.string().max(50)).optional(),
  folder: z.string().max(100).optional().nullable(),
  isPinned: z.boolean().optional(),
});

// GET /api/projects/[projectId]/notes/[noteId]
export async function GET(req: NextRequest, { params }: Params) {
  return withAuth(async (req: NextRequest, { user }) => {
    try {
      const { projectId, noteId } = params;

      const note = await prisma.note.findFirst({
        where: {
          id: noteId,
          projectId,
          isActive: true,
        },
        select: noteFullSelect,
      });

      if (!note) {
        return NextResponse.json(
          { success: false, message: "Nota não encontrada" },
          { status: 404 }
        );
      }

      // Check visibility permissions
      if (note.visibility === "INTERNAL" && user.role === "COLLABORATOR") {
        return NextResponse.json(
          {
            success: false,
            message: "Você não tem permissão para visualizar esta nota",
          },
          { status: 403 }
        );
      }

      if (user.role === "CLIENT" && note.status !== "PUBLISHED") {
        return NextResponse.json(
          {
            success: false,
            message: "Você não tem permissão para visualizar esta nota",
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { success: true, data: note },
        { status: 200 }
      );
    } catch (error) {
      console.error("[NOTE_GET]", error);
      return handlePrismaError(error);
    }
  })(req);
}

// PATCH /api/projects/[projectId]/notes/[noteId]
export async function PATCH(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canUpdateNotes", async (req: NextRequest, { user }) => {
      try {
        const { projectId, noteId } = params;

        // Parse and validate body
        const bodyResult = await parseRequestBody(req, updateNoteSchema);
        if ("error" in bodyResult) return bodyResult.error;

        const data = bodyResult.data;

        // Get existing note
        const existingNote = await prisma.note.findFirst({
          where: {
            id: noteId,
            projectId,
            isActive: true,
          },
        });

        if (!existingNote) {
          return NextResponse.json(
            { success: false, message: "Nota não encontrada" },
            { status: 404 }
          );
        }

        // Check if user can update this note
        if (existingNote.authorId !== user.id && user.role === "COLLABORATOR") {
          return NextResponse.json(
            {
              success: false,
              message: "Você só pode editar suas próprias notas",
            },
            { status: 403 }
          );
        }

        // Only ADMIN/SUPE R_ADMIN can change to INTERNAL
        if (data.visibility === "INTERNAL" && user.role === "COLLABORATOR") {
          return NextResponse.json(
            {
              success: false,
              message: "Você não tem permissão para criar notas internas",
            },
            { status: 403 }
          );
        }

        // Update in transaction with history
        const updatedNote = await prisma.$transaction(async (tx) => {
          // Create history entry before updating
          await tx.noteHistory.create({
            data: {
              noteId,
              title: existingNote.title,
              content: existingNote.content,
              version: existingNote.version,
              savedById: user.id,
            },
          });

          // Update note
          const updated = await tx.note.update({
            where: { id: noteId },
            data: {
              ...(data.title && { title: data.title }),
              ...(data.content && { content: data.content }),
              ...(data.visibility && { visibility: data.visibility }),
              ...(data.status && { status: data.status }),
              ...(data.tags && { tags: data.tags }),
              ...(data.folder !== undefined && { folder: data.folder }),
              ...(data.isPinned !== undefined && { isPinned: data.isPinned }),
              version: { increment: 1 },
            },
            select: noteFullSelect,
          });

          return updated;
        });

        // Log audit
        await logAudit({
          action: "NOTE_UPDATE",
          userId: user.id,
          targetType: "NOTE",
          targetId: noteId,
          metadata: {
            projectId,
            updatedFields: Object.keys(data),
            newVersion: existingNote.version + 1,
          },
        });

        return NextResponse.json(
          {
            success: true,
            data: updatedNote,
            message: "Nota atualizada com sucesso",
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("[NOTE_PATCH]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}

// DELETE /api/projects/[projectId]/notes/[noteId]
export async function DELETE(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canDeleteNotes", async (req: NextRequest, { user }) => {
      try {
        const { projectId, noteId } = params;

        // Get note
        const note = await prisma.note.findFirst({
          where: {
            id: noteId,
            projectId,
            isActive: true,
          },
        });

        if (!note) {
          return NextResponse.json(
            { success: false, message: "Nota não encontrada" },
            { status: 404 }
          );
        }

        // Check if user can delete this note
        if (note.authorId !== user.id && user.role === "COLLABORATOR") {
          return NextResponse.json(
            {
              success: false,
              message: "Você só pode excluir suas próprias notas",
            },
            { status: 403 }
          );
        }

        // Delete note and its history (hard delete)
        await prisma.$transaction([
          prisma.noteHistory.deleteMany({
            where: { noteId },
          }),
          prisma.note.delete({
            where: { id: noteId },
          }),
        ]);

        // Log audit
        await logAudit({
          action: "NOTE_DELETE",
          userId: user.id,
          targetType: "NOTE",
          targetId: noteId,
          metadata: {
            projectId,
            title: note.title,
          },
        });

        return NextResponse.json(
          {
            success: true,
            message: "Nota removida com sucesso",
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("[NOTE_DELETE]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}
