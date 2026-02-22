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
import { meetingListSelect } from "@/lib/queries/section-queries";
import { userSelectMin } from "@/lib/queries/user-queries";

interface Params {
  params: { projectId: string };
}

// Schema for creating a meeting
const createMeetingSchema = z.object({
  title: z.string().min(2).max(200),
  date: z.string().datetime(),
  duration: z.number().int().min(1).max(480).optional(),
  type: z.enum(["IN_PERSON", "ONLINE", "HYBRID"]).default("ONLINE"),
  meetingUrl: z.string().url().optional(),
  location: z.string().max(300).optional(),
  agenda: z.record(z.unknown()).optional(),
  participantIds: z.array(z.string().uuid()).optional(),
  externalParticipants: z
    .array(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
      })
    )
    .optional(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).default("SCHEDULED"),
  isVisibleToClient: z.boolean().default(true),
});

// GET /api/projects/[projectId]/meetings - Lista reuniões
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
        ["date", "title", "status", "createdAt"],
        "date",
        "desc"
      );

      // Parse filters
      const status = searchParams.get("status");
      const type = searchParams.get("type");
      const from = searchParams.get("from");
      const to = searchParams.get("to");

      // Build where clause
      const where: any = {
        projectId,
        isActive: true,
      };

      // For CLIENT: only show visible meetings
      if (user.role === "CLIENT") {
        where.isVisibleToClient = true;
      }

      if (status) where.status = status;
      if (type) where.type = type;
      if (from || to) {
        where.date = {};
        if (from) where.date.gte = new Date(from);
        if (to) where.date.lte = new Date(to);
      }

      // Execute query
      const [meetings, total] = await Promise.all([
        prisma.meeting.findMany({
          where,
          select: {
            ...meetingListSelect,
            participants: {
              include: {
                user: {
                  select: userSelectMin,
                },
              },
              take: 5,
            },
            attachments: {
              select: {
                id: true,
                name: true,
                url: true,
                type: true,
              },
            },
          },
          skip,
          take,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.meeting.count({ where }),
      ]);

      return NextResponse.json(
        formatPaginatedResponse(meetings, total, page, pageSize),
        { status: 200 }
      );
    } catch (error) {
      console.error("[MEETINGS_GET]", error);
      return handlePrismaError(error);
    }
  })(req);
}

// POST /api/projects/[projectId]/meetings - Cria reunião
export async function POST(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canManageMeetings", async (req: NextRequest, { user }) => {
      try {
        const { projectId } = params;

        // Parse and validate body
        const bodyResult = await parseRequestBody(req, createMeetingSchema);
        if ("error" in bodyResult) return bodyResult.error;

        const data = bodyResult.data;

        // Verify project exists
        const project = await prisma.project.findUnique({
          where: { id: projectId, isActive: true },
          select: { id: true, name: true },
        });

        if (!project) {
          return NextResponse.json(
            { success: false, message: "Projeto não encontrado" },
            { status: 404 }
          );
        }

        // Validate participants exist
        if (data.participantIds && data.participantIds.length > 0) {
          const validUsers = await prisma.user.findMany({
            where: {
              id: { in: data.participantIds },
              isActive: true,
            },
            select: { id: true },
          });

          const validUserIds = new Set(validUsers.map((u) => u.id));
          const invalidIds = data.participantIds.filter(
            (id) => !validUserIds.has(id)
          );

          if (invalidIds.length > 0) {
            return NextResponse.json(
              {
                success: false,
                message: "Alguns participantes não foram encontrados",
                errors: { participantIds: [`IDs inválidos: ${invalidIds.join(", ")}`] },
              },
              { status: 400 }
            );
          }
        }

        // Create meeting with participants in transaction
        const meeting = await prisma.$transaction(async (tx) => {
          // Create meeting
          const newMeeting = await tx.meeting.create({
            data: {
              projectId,
              title: data.title,
              date: new Date(data.date),
              duration: data.duration,
              type: data.type,
              meetingUrl: data.meetingUrl,
              location: data.location,
              agenda: data.agenda || {},
              status: data.status,
              isVisibleToClient: data.isVisibleToClient,
              createdById: user.id,
              isActive: true,
            },
          });

          // Create internal participants
          if (data.participantIds && data.participantIds.length > 0) {
            await tx.meetingParticipant.createMany({
              data: data.participantIds.map((userId) => ({
                meetingId: newMeeting.id,
                userId,
                isExternal: false,
              })),
            });
          }

          // Create external participants
          if (data.externalParticipants && data.externalParticipants.length > 0) {
            await tx.meetingParticipant.createMany({
              data: data.externalParticipants.map((ext) => ({
                meetingId: newMeeting.id,
                userId: null,
                name: ext.name,
                email: ext.email,
                isExternal: true,
              })),
            });
          }

          return newMeeting;
        });

        // Notify internal participants (non-blocking)
        if (data.participantIds && data.participantIds.length > 0) {
          const formattedDate = new Date(data.date).toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
          });

          prisma.notification
            .createMany({
              data: data.participantIds.map((participantId) => ({
                userId: participantId,
                type: "MEETING_SCHEDULED",
                title: "Nova reunião agendada",
                message: `"${data.title}" em ${formattedDate}`,
                link: `/projects/${projectId}/meetings/${meeting.id}`,
                metadata: {
                  meetingId: meeting.id,
                  projectId,
                },
              })),
            })
            .catch(console.error);
        }

        // Log audit
        await logAudit({
          action: "MEETING_CREATE",
          userId: user.id,
          targetType: "MEETING",
          targetId: meeting.id,
          metadata: {
            projectId,
            title: data.title,
            date: data.date,
          },
        });

        return NextResponse.json(
          {
            success: true,
            data: meeting,
            message: "Reunião criada com sucesso",
          },
          { status: 201 }
        );
      } catch (error) {
        console.error("[MEETINGS_POST]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}
