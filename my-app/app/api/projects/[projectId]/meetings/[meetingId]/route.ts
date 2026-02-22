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
import { meetingFullInclude } from "@/lib/queries/section-queries";

interface Params {
  params: { projectId: string; meetingId: string };
}

// Schema for updating a meeting
const updateMeetingSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  date: z.string().datetime().optional(),
  duration: z.number().int().min(1).max(480).optional(),
  type: z.enum(["IN_PERSON", "ONLINE", "HYBRID"]).optional(),
  meetingUrl: z.string().url().optional().nullable(),
  location: z.string().max(300).optional().nullable(),
  agenda: z.record(z.unknown()).optional(),
  minutes: z.record(z.unknown()).optional(),
  decisions: z.array(z.string()).optional(),
  nextSteps: z
    .array(
      z.object({
        description: z.string(),
        responsibleId: z.string().uuid().optional(),
        dueDate: z.string().datetime().optional(),
      })
    )
    .optional(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
  isVisibleToClient: z.boolean().optional(),
  participantIds: z.array(z.string().uuid()).optional(),
});

// GET /api/projects/[projectId]/meetings/[meetingId] - Obtém reunião
export async function GET(req: NextRequest, { params }: Params) {
  return withAuth(async (req: NextRequest, { user }) => {
    try {
      const { projectId, meetingId } = params;

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

      const meeting = await prisma.meeting.findFirst({
        where: {
          id: meetingId,
          projectId,
          isActive: true,
        },
        include: meetingFullInclude,
      });

      if (!meeting) {
        return NextResponse.json(
          { success: false, message: "Reunião não encontrada" },
          { status: 404 }
        );
      }

      // For CLIENT: check visibility
      if (user.role === "CLIENT" && !meeting.isVisibleToClient) {
        return NextResponse.json(
          {
            success: false,
            message: "Você não tem permissão para visualizar esta reunião",
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { success: true, data: meeting },
        { status: 200 }
      );
    } catch (error) {
      console.error("[MEETING_GET]", error);
      return handlePrismaError(error);
    }
  })(req);
}

// PATCH /api/projects/[projectId]/meetings/[meetingId] - Atualiza reunião
export async function PATCH(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canManageMeetings", async (req: NextRequest, { user }) => {
      try {
        const { projectId, meetingId } = params;

        // Parse and validate body
        const bodyResult = await parseRequestBody(req, updateMeetingSchema);
        if ("error" in bodyResult) return bodyResult.error;

        const data = bodyResult.data;

        // Check if meeting exists
        const existingMeeting = await prisma.meeting.findFirst({
          where: {
            id: meetingId,
            projectId,
            isActive: true,
          },
          select: {
            id: true,
            status: true,
            title: true,
          },
        });

        if (!existingMeeting) {
          return NextResponse.json(
            { success: false, message: "Reunião não encontrada" },
            { status: 404 }
          );
        }

        // Check if status is changing to COMPLETED
        const isCompleting =
          data.status === "COMPLETED" && existingMeeting.status !== "COMPLETED";

        // Update meeting
        const updatedMeeting = await prisma.$transaction(async (tx) => {
          // Update meeting fields
          const updated = await tx.meeting.update({
            where: { id: meetingId },
            data: {
              ...(data.title && { title: data.title }),
              ...(data.date && { date: new Date(data.date) }),
              ...(data.duration !== undefined && { duration: data.duration }),
              ...(data.type && { type: data.type }),
              ...(data.meetingUrl !== undefined && { meetingUrl: data.meetingUrl }),
              ...(data.location !== undefined && { location: data.location }),
              ...(data.agenda && { agenda: data.agenda }),
              ...(data.minutes && { minutes: data.minutes }),
              ...(data.decisions && { decisions: data.decisions }),
              ...(data.nextSteps && { nextSteps: data.nextSteps }),
              ...(data.status && { status: data.status }),
              ...(data.isVisibleToClient !== undefined && {
                isVisibleToClient: data.isVisibleToClient,
              }),
            },
          });

          // Update participants if provided
          if (data.participantIds) {
            // Remove existing internal participants
            await tx.meetingParticipant.deleteMany({
              where: {
                meetingId,
                isExternal: false,
              },
            });

            // Add new participants
            if (data.participantIds.length > 0) {
              await tx.meetingParticipant.createMany({
                data: data.participantIds.map((userId) => ({
                  meetingId,
                  userId,
                  isExternal: false,
                })),
              });
            }
          }

          return updated;
        });

        // Log audit
        await logAudit({
          action: "MEETING_UPDATE",
          userId: user.id,
          targetType: "MEETING",
          targetId: meetingId,
          metadata: {
            projectId,
            updatedFields: Object.keys(data),
            statusChanged: data.status !== undefined,
          },
        });

        // Build response
        const response: any = {
          success: true,
          data: updatedMeeting,
          message: "Reunião atualizada com sucesso",
        };

        // Suggest task creation if meeting was completed
        if (isCompleting && data.nextSteps && data.nextSteps.length > 0) {
          response.suggestTaskCreation = true;
          response.nextStepsCount = data.nextSteps.length;
        }

        return NextResponse.json(response, { status: 200 });
      } catch (error) {
        console.error("[MEETING_PATCH]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}

// DELETE /api/projects/[projectId]/meetings/[meetingId] - Remove reunião
export async function DELETE(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canManageMeetings", async (req: NextRequest, { user }) => {
      try {
        const { projectId, meetingId } = params;

        // Check if meeting exists
        const meeting = await prisma.meeting.findFirst({
          where: {
            id: meetingId,
            projectId,
            isActive: true,
          },
        });

        if (!meeting) {
          return NextResponse.json(
            { success: false, message: "Reunião não encontrada" },
            { status: 404 }
          );
        }

        // Soft delete
        await prisma.meeting.update({
          where: { id: meetingId },
          data: { isActive: false },
        });

        // Log audit
        await logAudit({
          action: "MEETING_DELETE",
          userId: user.id,
          targetType: "MEETING",
          targetId: meetingId,
          metadata: {
            projectId,
            title: meeting.title,
          },
        });

        return NextResponse.json(
          {
            success: true,
            message: "Reunião removida com sucesso",
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("[MEETING_DELETE]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}
