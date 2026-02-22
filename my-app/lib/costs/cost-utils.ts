import { CostEntry, CostType, CostStatus } from "@prisma/client";
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export const COST_TYPE_CONFIG: Record<CostType, { label: string; color: string; icon: string }> = {
  LABOR: { label: "Mão de Obra", color: "bg-blue-500", icon: "Users" },
  MATERIAL: { label: "Material", color: "bg-orange-500", icon: "Package" },
  SERVICE: { label: "Serviço", color: "bg-purple-500", icon: "Briefcase" },
  SOFTWARE: { label: "Software", color: "bg-cyan-500", icon: "Monitor" },
  HARDWARE: { label: "Hardware", color: "bg-gray-500", icon: "Cpu" },
  TRAVEL: { label: "Viagem", color: "bg-green-500", icon: "Plane" },
  OTHER: { label: "Outro", color: "bg-slate-500", icon: "MoreHorizontal" },
};

export const COST_STATUS_CONFIG: Record<CostStatus, { label: string; color: string; variant: string }> = {
  PENDING: { label: "Pendente", color: "text-yellow-500", variant: "warning" },
  APPROVED: { label: "Aprovado", color: "text-blue-500", variant: "default" },
  REJECTED: { label: "Rejeitado", color: "text-red-500", variant: "destructive" },
  PAID: { label: "Pago", color: "text-green-500", variant: "success" },
};

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function parseCurrency(value: string): number {
  const cleanValue = value.replace(/[^\d,-]/g, "").replace(",", ".");
  return parseFloat(cleanValue) || 0;
}

export function formatCurrencyInput(value: string): string {
  const numericValue = value.replace(/\D/g, "");
  const floatValue = parseFloat(numericValue) / 100;
  
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(floatValue);
}

export function calculateCostMetrics(entries: CostEntry[], budget: number = 0) {
  const totalActual = entries.reduce((sum, entry) => sum + entry.amount * entry.quantity, 0);
  const totalApproved = entries
    .filter((e) => e.status === "APPROVED" || e.status === "PAID")
    .reduce((sum, entry) => sum + entry.amount * entry.quantity, 0);
  const totalPending = entries
    .filter((e) => e.status === "PENDING")
    .reduce((sum, entry) => sum + entry.amount * entry.quantity, 0);
  const totalPaid = entries
    .filter((e) => e.status === "PAID")
    .reduce((sum, entry) => sum + entry.amount * entry.quantity, 0);

  return {
    budget,
    totalActual,
    balance: budget - totalActual,
    toApprove: totalPending,
    approved: totalApproved,
    paid: totalPaid,
    utilizationRate: budget > 0 ? (totalActual / budget) * 100 : 0,
  };
}

export function getCostsByCategory(entries: CostEntry[]): { type: CostType; amount: number; percentage: number }[] {
  const total = entries.reduce((sum, entry) => sum + entry.amount * entry.quantity, 0);
  
  const grouped = entries.reduce((acc, entry) => {
    const amount = entry.amount * entry.quantity;
    acc[entry.type] = (acc[entry.type] || 0) + amount;
    return acc;
  }, {} as Record<CostType, number>);

  return Object.entries(grouped).map(([type, amount]) => ({
    type: type as CostType,
    amount,
    percentage: total > 0 ? (amount / total) * 100 : 0,
  }));
}

export function getCostsByMonth(entries: CostEntry[]): { month: string; amount: number; planned?: number }[] {
  const grouped = entries.reduce((acc, entry) => {
    const monthKey = format(entry.date, "yyyy-MM");
    const amount = entry.amount * entry.quantity;
    acc[monthKey] = (acc[monthKey] || 0) + amount;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(grouped)
    .map(([month, amount]) => ({
      month: format(parseISO(`${month}-01`), "MMM/yyyy", { locale: ptBR }),
      amount,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function getCostsByStatus(entries: CostEntry[]): { status: CostStatus; count: number; amount: number }[] {
  const grouped = entries.reduce((acc, entry) => {
    const amount = entry.amount * entry.quantity;
    if (!acc[entry.status]) {
      acc[entry.status] = { count: 0, amount: 0 };
    }
    acc[entry.status].count++;
    acc[entry.status].amount += amount;
    return acc;
  }, {} as Record<CostStatus, { count: number; amount: number }>);

  return Object.entries(grouped).map(([status, data]) => ({
    status: status as CostStatus,
    count: data.count,
    amount: data.amount,
  }));
}

export function filterCostsByDateRange(
  entries: CostEntry[],
  startDate: Date,
  endDate: Date
): CostEntry[] {
  return entries.filter((entry) =>
    isWithinInterval(entry.date, { start: startDate, end: endDate })
  );
}

export function exportCostsToCSV(entries: CostEntry[]): string {
  const headers = ["Data", "Descrição", "Tipo", "Quantidade", "Valor Unitário", "Valor Total", "Status", "Observações"];
  
  const rows = entries.map((entry) => [
    format(entry.date, "dd/MM/yyyy"),
    entry.description,
    COST_TYPE_CONFIG[entry.type].label,
    entry.quantity,
    formatCurrency(entry.unitPrice || entry.amount),
    formatCurrency(entry.amount * entry.quantity),
    COST_STATUS_CONFIG[entry.status].label,
    entry.notes || "",
  ]);

  return [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n");
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function calculatePlannedVsActual(
  entries: CostEntry[],
  plannedBudgets: { category: CostType; amount: number }[]
): { category: CostType; planned: number; actual: number; variance: number; variancePercent: number }[] {
  const actualByCategory = entries.reduce((acc, entry) => {
    const amount = entry.amount * entry.quantity;
    acc[entry.type] = (acc[entry.type] || 0) + amount;
    return acc;
  }, {} as Record<CostType, number>);

  const allCategories = new Set([
    ...plannedBudgets.map((p) => p.category),
    ...Object.keys(actualByCategory),
  ]);

  return Array.from(allCategories).map((category) => {
    const planned = plannedBudgets.find((p) => p.category === category)?.amount || 0;
    const actual = actualByCategory[category as CostType] || 0;
    const variance = planned - actual;
    const variancePercent = planned > 0 ? (variance / planned) * 100 : 0;

    return {
      category: category as CostType,
      planned,
      actual,
      variance,
      variancePercent,
    };
  });
}
