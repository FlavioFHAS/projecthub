import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withPermission } from "@/lib/middleware";
import { handlePrismaError } from "@/lib/api-helpers";
import { meetingFullInclude } from "@/lib/queries/section-queries";

interface Params {
  params: { projectId: string; meetingId: string };
}

// GET /api/projects/[projectId]/meetings/[meetingId]/export
// Returns meeting data formatted for PDF export
// Actual PDF generation should be done on the client or using a separate service
export async function GET(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canViewMeetings", async (req: NextRequest, { user }) => {
      try {
        const { projectId, meetingId } = params;

        // Get meeting with all details
        const meeting = await prisma.meeting.findFirst({
          where: {
            id: meetingId,
            projectId,
            isActive: true,
          },
          include: {
            ...meetingFullInclude,
            project: {
              select: {
                id: true,
                name: true,
                client: {
                  select: {
                    id: true,
                    name: true,
                    logo: true,
                  },
                },
              },
            },
          },
        });

        if (!meeting) {
          return NextResponse.json(
            { success: false, message: "Reunião não encontrada" },
            { status: 404 }
          );
        }

        // Format data for export
        const exportData = {
          meeting: {
            id: meeting.id,
            title: meeting.title,
            date: meeting.date,
            duration: meeting.duration,
            type: meeting.type,
            location: meeting.location,
            meetingUrl: meeting.meetingUrl,
            status: meeting.status,
          },
          project: meeting.project,
          participants: {
            internal: meeting.participants.filter((p) => !p.isExternal),
            external: meeting.participants.filter((p) => p.isExternal),
          },
          agenda: meeting.agenda,
          minutes: meeting.minutes,
          decisions: meeting.decisions,
          nextSteps: meeting.nextSteps,
          attachments: meeting.attachments,
          createdBy: meeting.createdBy,
          createdAt: meeting.createdAt,
          exportedAt: new Date(),
        };

        // For now, return JSON data
        // In production, you would use @react-pdf/renderer or puppeteer
        // to generate an actual PDF and return it with:
        // Content-Type: application/pdf
        // Content-Disposition: attachment; filename="ata-${slug}.pdf"

        return NextResponse.json(
          {
            success: true,
            data: exportData,
            message: "Dados da ata exportados com sucesso",
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("[MEETING_EXPORT]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}
