import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withPermission } from "@/lib/middleware";
import { z } from "zod";
import { parseRequestBody, handlePrismaError, logAudit } from "@/lib/api-helpers";
import { userSelectMin } from "@/lib/queries/user-queries";

interface Params {
  params: { projectId: string; taskId: string };
}

const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  mentions: z.array(z.string().uuid()).optional(),
});

// GET /api/projects/[projectId]/tasks/[taskId]/comments
export async function GET(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canViewTasks", async (req: NextRequest, { user }) => {
      try {
        const { projectId, taskId } = params;

        const comments = await prisma.taskComment.findMany({
          where: {
            taskId,
            task: {
              projectId,
            },
          },
          include: {
            user: {
              select: userSelectMin,
            },
          },
          orderBy: { createdAt: "asc" },
        });

        return NextResponse.json(
          { success: true, data: comments },
          { status: 200 }
        );
      } catch (error) {
        console.error("[TASK_COMMENTS_GET]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}

// POST /api/projects/[projectId]/tasks/[taskId]/comments
export async function POST(req: NextRequest, { params }: Params) {
  return withAuth(
    withPermission("canCommentOnTasks", async (req: NextRequest, { user }) => {
      try {
        const { projectId, taskId } = params;

        // Parse and validate body
        const bodyResult = await parseRequestBody(req, createCommentSchema);
        if ("error" in bodyResult) return bodyResult.error;

        const data = bodyResult.data;

        // Verify task exists
        const task = await prisma.task.findFirst({
          where: {
            id: taskId,
            projectId,
            isActive: true,
          },
          select: { id: true, title: true },
        });

        if (!task) {
          return NextResponse.json(
            { success: false, message: "Tarefa não encontrada" },
            { status: 404 }
          );
        }

        // Create comment
        const comment = await prisma.taskComment.create({
          data: {
            taskId,
            userId: user.id,
            content: data.content,
          },
          include: {
            user: {
              select: userSelectMin,
            },
          },
        });

        // Notify mentioned users (non-blocking)
        if (data.mentions && data.mentions.length > 0) {
          prisma.notification
            .createMany({
              data: data.mentions.map((mentionedId) => ({
                userId: mentionedId,
                type: "COMMENT_MENTION",
                title: `${user.name} mencionou você`,
                message: `Em tarefa: "${task.title}"`,
                link: `/projects/${projectId}/tasks/${taskId}`,
                metadata: {
                  taskId,
                  projectId,
                  commentId: comment.id,
                },
              })),
            })
            .catch(console.error);
        }

        // Log audit
        await logAudit({
          action: "TASK_COMMENT_CREATE",
          userId: user.id,
          targetType: "TASK_COMMENT",
          targetId: comment.id,
          metadata: {
            projectId,
            taskId,
            mentions: data.mentions?.length || 0,
          },
        });

        return NextResponse.json(
          {
            success: true,
            data: comment,
            message: "Comentário adicionado com sucesso",
          },
          { status: 201 }
        );
      } catch (error) {
        console.error("[TASK_COMMENTS_POST]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}
