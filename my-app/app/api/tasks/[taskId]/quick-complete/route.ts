import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const task = await prisma.task.findUnique({
      where: { id: params.taskId },
      include: {
        assignees: true,
        project: { select: { id: true, name: true } },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Tarefa não encontrada" },
        { status: 404 }
      );
    }

    // Check if user is assignee or admin
    const isAssignee = task.assignees.some(
      (a) => a.userId === session.user.id
    );
    const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(session.user.role);

    if (!isAssignee && !isAdmin) {
      return NextResponse.json(
        { error: "Sem permissão para concluir esta tarefa" },
        { status: 403 }
      );
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: params.taskId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        projectId: task.projectId,
        action: "TASK_COMPLETED",
        entity: "Task",
        entityId: task.id,
        description: `Tarefa "${task.title}" concluída via dashboard`,
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error completing task:", error);
    return NextResponse.json(
      { error: "Erro ao concluir tarefa" },
      { status: 500 }
    );
  }
}
