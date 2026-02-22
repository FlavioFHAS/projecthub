import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";
import { checkProjectPermissions } from "@/lib/permissions";
import { z } from "zod";

const updateSectionSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  isVisible: z.boolean().optional(),
  visibleToRoles: z.array(z.string()).optional(),
  config: z.record(z.unknown()).optional(),
  order: z.number().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string; sectionId: string } }
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

    const section = await prisma.section.findFirst({
      where: {
        id: params.sectionId,
        projectId: params.projectId,
      },
    });

    if (!section) {
      return NextResponse.json(
        { error: "Seção não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(section);
  } catch (error) {
    console.error("Error fetching section:", error);
    return NextResponse.json(
      { error: "Erro ao carregar seção" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string; sectionId: string } }
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
        { error: "Sem permissão para editar" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateSectionSchema.parse(body);

    const section = await prisma.section.update({
      where: {
        id: params.sectionId,
        projectId: params.projectId,
      },
      data: validatedData,
    });

    return NextResponse.json(section);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating section:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar seção" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string; sectionId: string } }
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

    await prisma.section.delete({
      where: {
        id: params.sectionId,
        projectId: params.projectId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting section:", error);
    return NextResponse.json(
      { error: "Erro ao excluir seção" },
      { status: 500 }
    );
  }
}
