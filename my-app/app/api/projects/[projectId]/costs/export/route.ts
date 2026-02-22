import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";
import { checkProjectPermissions } from "@/lib/permissions";
import { format } from "date-fns";
import { COST_TYPE_CONFIG, COST_STATUS_CONFIG } from "@/lib/costs/cost-utils";

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
        { error: "Sem permissão para exportar" },
        { status: 403 }
      );
    }

    const entries = await prisma.costEntry.findMany({
      where: { projectId: params.projectId },
      orderBy: { date: "desc" },
    });

    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
      select: { name: true },
    });

    const headers = [
      "Data",
      "Descrição",
      "Tipo",
      "Quantidade",
      "Valor Unitário",
      "Valor Total",
      "Status",
      "Observações",
    ];

    const rows = entries.map((entry) => [
      format(entry.date, "dd/MM/yyyy"),
      entry.description,
      COST_TYPE_CONFIG[entry.type].label,
      entry.quantity.toString(),
      (entry.unitPrice || entry.amount).toString().replace(".", ","),
      (entry.amount * entry.quantity).toString().replace(".", ","),
      COST_STATUS_CONFIG[entry.status].label,
      entry.notes || "",
    ]);

    const csvContent = [headers.join(";"), ...rows.map((row) => row.join(";"))].join(
      "\n"
    );

    const bom = "\uFEFF";
    const fullContent = bom + csvContent;

    return new NextResponse(fullContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="custos-${project?.name || params.projectId}-${format(
          new Date(),
          "yyyy-MM-dd"
        )}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting costs:", error);
    return NextResponse.json(
      { error: "Erro ao exportar custos" },
      { status: 500 }
    );
  }
}
