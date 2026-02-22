import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withPermission } from "@/lib/middleware";
import { z } from "zod";
import { parseRequestBody, handlePrismaError, logAudit } from "@/lib/api-helpers";
import { noteFullSelect } from "@/lib/queries/section-queries";

interface Params {
  params: { projectId: string; noteId: string };
}

const restoreSchema = z.object({
  historyId: z.string().uuid(),
});

// POST /api/projects/[projectId]/notes/[noteId]/restore
export async function POST(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canUpdateNotes", async (req: NextRequest, { user }) => {
      try {
        const { projectId, noteId } = params;

        // Parse and validate body
        const bodyResult = await parseRequestBody(req, restoreSchema);
        if ("error" in bodyResult) return bodyResult.error;

        const { historyId } = bodyResult.data;

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

        // Get history version
        const history = await prisma.noteHistory.findFirst({
          where: {
            id: historyId,
            noteId,
          },
        });

        if (!history) {
          return NextResponse.json(
            { success: false, message: "Versão não encontrada" },
            { status: 404 }
          );
        }

        // Check if user can update this note
        if (note.authorId !== user.id && user.role === "COLLABORATOR") {
          return NextResponse.json(
            {
              success: false,
              message: "Você só pode restaurar suas próprias notas",
            },
            { status: 403 }
          );
        }

        // Restore in transaction
        const restoredNote = await prisma.$transaction(async (tx) => {
          // Create history entry for current state before restoring
          await tx.noteHistory.create({
            data: {
              noteId,
              title: note.title,
              content: note.content,
              version: note.version,
              savedById: user.id,
            },
          });

          // Restore from history
          const updated = await tx.note.update({
            where: { id: noteId },
            data: {
              title: history.title,
              content: history.content,
              version: { increment: 1 },
            },
            select: noteFullSelect,
          });

          return updated;
        });

        // Log audit
        await logAudit({
          action: "NOTE_RESTORE",
          userId: user.id,
          targetType: "NOTE",
          targetId: noteId,
          metadata: {
            projectId,
            restoredFromVersion: history.version,
            newVersion: note.version + 1,
          },
        });

        return NextResponse.json(
          {
            success: true,
            data: restoredNote,
            message: `Nota restaurada para versão ${history.version} com sucesso`,
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("[NOTE_RESTORE]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}
