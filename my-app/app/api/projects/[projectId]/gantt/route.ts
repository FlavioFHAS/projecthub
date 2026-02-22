import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";
import { checkProjectPermissions } from "@/lib/permissions";
import { z } from "zod";

const createGanttItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  progress: z.number().min(0).max(100).default(0),
  dependencies: z.array(z.string()).optional(),
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

    const items = await prisma.ganttItem.findMany({
      where: { projectId: params.projectId },
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching Gantt items:", error);
    return NextResponse.json(
      { error: "Erro ao carregar itens do Gantt" },
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
    const validatedData = createGanttItemSchema.parse(body);

    const item = await prisma.ganttItem.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        progress: validatedData.progress,
        dependencies: validatedData.dependencies || [],
        projectId: params.projectId,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating Gantt item:", error);
    return NextResponse.json(
      { error: "Erro ao criar item" },
      { status: 500 }
    );
  }
}
