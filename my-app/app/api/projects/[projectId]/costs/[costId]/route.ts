import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";
import { checkProjectPermissions } from "@/lib/permissions";
import { z } from "zod";
import { CostType, CostStatus } from "@prisma/client";

const updateCostSchema = z.object({
  description: z.string().min(1).optional(),
  type: z.nativeEnum(CostType).optional(),
  amount: z.number().min(0.01).optional(),
  quantity: z.number().min(1).optional(),
  unitPrice: z.number().optional(),
  date: z.string().or(z.date()).optional(),
  status: z.nativeEnum(CostStatus).optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string; costId: string } }
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
    const validatedData = updateCostSchema.parse(body);

    const updateData: any = {};
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.amount !== undefined) updateData.amount = validatedData.amount;
    if (validatedData.quantity !== undefined)
      updateData.quantity = validatedData.quantity;
    if (validatedData.unitPrice !== undefined)
      updateData.unitPrice = validatedData.unitPrice;
    if (validatedData.date !== undefined)
      updateData.date = new Date(validatedData.date);
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;

    const entry = await prisma.costEntry.update({
      where: { id: params.costId },
      data: updateData,
    });

    return NextResponse.json(entry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating cost entry:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar custo" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string; costId: string } }
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

    await prisma.costEntry.delete({
      where: { id: params.costId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cost entry:", error);
    return NextResponse.json(
      { error: "Erro ao excluir custo" },
      { status: 500 }
    );
  }
}
