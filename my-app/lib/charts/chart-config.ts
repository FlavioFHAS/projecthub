import { ChartConfig } from "@/components/ui/chart";

export const costEvolutionChartConfig: ChartConfig = {
  amount: {
    label: "Valor",
    color: "hsl(var(--chart-1))",
  },
  planned: {
    label: "Planejado",
    color: "hsl(var(--chart-2))",
  },
};

export const costCategoryChartConfig: ChartConfig = {
  LABOR: {
    label: "Mão de Obra",
    color: "hsl(217, 91%, 60%)",
  },
  MATERIAL: {
    label: "Material",
    color: "hsl(24, 95%, 53%)",
  },
  SERVICE: {
    label: "Serviço",
    color: "hsl(271, 91%, 65%)",
  },
  SOFTWARE: {
    label: "Software",
    color: "hsl(189, 94%, 43%)",
  },
  HARDWARE: {
    label: "Hardware",
    color: "hsl(215, 16%, 47%)",
  },
  TRAVEL: {
    label: "Viagem",
    color: "hsl(142, 71%, 45%)",
  },
  OTHER: {
    label: "Outro",
    color: "hsl(215, 20%, 65%)",
  },
};

export const costStatusChartConfig: ChartConfig = {
  PENDING: {
    label: "Pendente",
    color: "hsl(48, 96%, 53%)",
  },
  APPROVED: {
    label: "Aprovado",
    color: "hsl(217, 91%, 60%)",
  },
  REJECTED: {
    label: "Rejeitado",
    color: "hsl(0, 84%, 60%)",
  },
  PAID: {
    label: "Pago",
    color: "hsl(142, 71%, 45%)",
  },
};

export const chartColors = {
  primary: "hsl(var(--chart-1))",
  secondary: "hsl(var(--chart-2))",
  tertiary: "hsl(var(--chart-3))",
  quaternary: "hsl(var(--chart-4))",
  quinary: "hsl(var(--chart-5))",
};

export const getChartColor = (index: number): string => {
  const colors = [
    "hsl(217, 91%, 60%)",
    "hsl(24, 95%, 53%)",
    "hsl(271, 91%, 65%)",
    "hsl(189, 94%, 43%)",
    "hsl(142, 71%, 45%)",
    "hsl(330, 81%, 60%)",
    "hsl(215, 16%, 47%)",
    "hsl(48, 96%, 53%)",
  ];
  return colors[index % colors.length];
};
