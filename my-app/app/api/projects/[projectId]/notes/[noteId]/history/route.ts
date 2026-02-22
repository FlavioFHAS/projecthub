import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withPermission } from "@/lib/middleware";
import { handlePrismaError } from "@/lib/api-helpers";
import { userSelectMin } from "@/lib/queries/user-queries";

interface Params {
  params: { projectId: string; noteId: string };
}

// GET /api/projects/[projectId]/notes/[noteId]/history
export async function GET(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canViewNotes", async (req: NextRequest, { user }) => {
      try {
        const { projectId, noteId } = params;

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

        // Get history
        const history = await prisma.noteHistory.findMany({
          where: { noteId },
          select: {
            id: true,
            version: true,
            title: true,
            createdAt: true,
            savedBy: {
              select: userSelectMin,
            },
          },
          orderBy: { version: "desc" },
        });

        return NextResponse.json(
          { success: true, data: history },
          { status: 200 }
        );
      } catch (error) {
        console.error("[NOTE_HISTORY_GET]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}
