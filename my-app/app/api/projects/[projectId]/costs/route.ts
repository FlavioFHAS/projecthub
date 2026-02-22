import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";
import { checkProjectPermissions } from "@/lib/permissions";
import { z } from "zod";
import { CostType, CostStatus } from "@prisma/client";

const createCostSchema = z.object({
  description: z.string().min(1),
  type: z.nativeEnum(CostType),
  amount: z.number().min(0.01),
  quantity: z.number().min(1).default(1),
  unitPrice: z.number().optional(),
  date: z.string().or(z.date()),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { canView } = await checkProjectPermissions(
      params.projectId,
      session.user.id
    );

    if (!canView) {
      return NextResponse.json(
        { error: "Sem permissão para visualizar" },
        { status: 403 }
      );
    }

    const entries = await prisma.costEntry.findMany({
      where: { projectId: params.projectId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching cost entries:", error);
    return NextResponse.json(
      { error: "Erro ao carregar custos" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
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
        { error: "Sem permissão para criar" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createCostSchema.parse(body);

    const entry = await prisma.costEntry.create({
      data: {
        description: validatedData.description,
        type: validatedData.type,
        amount: validatedData.amount,
        quantity: validatedData.quantity,
        unitPrice: validatedData.unitPrice,
        date: new Date(validatedData.date),
        notes: validatedData.notes,
        projectId: params.projectId,
        status: CostStatus.PENDING,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating cost entry:", error);
    return NextResponse.json(
      { error: "Erro ao criar custo" },
      { status: 500 }
    );
  }
}
