import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withPermission } from "@/lib/middleware";
import { handlePrismaError } from "@/lib/api-helpers";
import { userSelectMin } from "@/lib/queries/user-queries";

interface Params {
  params: { projectId: string; noteId: string; historyId: string };
}

// GET /api/projects/[projectId]/notes/[noteId]/history/[historyId]
export async function GET(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canViewNotes", async (req: NextRequest, { user }) => {
      try {
        const { projectId, noteId, historyId } = params;

        // Verify note exists and belongs to project
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

        // Get specific history version
        const history = await prisma.noteHistory.findFirst({
          where: {
            id: historyId,
            noteId,
          },
          include: {
            savedBy: {
              select: userSelectMin,
            },
          },
        });

        if (!history) {
          return NextResponse.json(
            { success: false, message: "Versão não encontrada" },
            { status: 404 }
          );
        }

        return NextResponse.json(
          { success: true, data: history },
          { status: 200 }
        );
      } catch (error) {
        console.error("[NOTE_HISTORY_VERSION_GET]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}
