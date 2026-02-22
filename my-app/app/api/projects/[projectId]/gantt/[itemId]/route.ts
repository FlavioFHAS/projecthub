import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";
import { checkProjectPermissions } from "@/lib/permissions";
import { z } from "zod";

const updateGanttItemSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  progress: z.number().min(0).max(100).optional(),
  dependencies: z.array(z.string()).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string; itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { canManage } = await checkProjectPermissions(
      params.projectId,
      session.user.id
    );

    if (!canManage) {
      return NextResponse.json(
        { error: "Sem permissão para atualizar" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateGanttItemSchema.parse(body);

    const updateData: any = {};
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description;
    if (validatedData.startDate !== undefined)
      updateData.startDate = new Date(validatedData.startDate);
    if (validatedData.endDate !== undefined)
      updateData.endDate = new Date(validatedData.endDate);
    if (validatedData.progress !== undefined)
      updateData.progress = validatedData.progress;
    if (validatedData.dependencies !== undefined)
      updateData.dependencies = validatedData.dependencies;

    const item = await prisma.ganttItem.update({
      where: { id: params.itemId },
      data: updateData,
    });

    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating Gantt item:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string; itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { canManage } = await checkProjectPermissions(
      params.projectId,
      session.user.id
    );

    if (!canManage) {
      return NextResponse.json(
        { error: "Sem permissão para excluir" },
        { status: 403 }
      );
    }

    await prisma.ganttItem.delete({
      where: { id: params.itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting Gantt item:", error);
    return NextResponse.json(
      { error: "Erro ao excluir item" },
      { status: 500 }
    );
  }
}
