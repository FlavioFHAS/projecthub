"use client";

import React from "react";
import { motion } from "framer-motion";
import { Briefcase, Building, CheckSquare, DollarSign, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface AdminMetricCardsProps {
  activeProjects: number;
  totalProjects: number;
  totalClients: number;
  newClientsThisMonth: number;
  openTasks: number;
  overdueTasks: number;
  weeklyProgress: number;
  budgetUtilization: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05 },
  }),
};

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
  trendUp,
  href,
  children,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  color: string;
  trend?: string;
  trendUp?: boolean;
  href?: string;
  children?: React.ReactNode;
}) {
  const content = (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            {trend && (
              <p className={cn("text-xs mt-2 flex items-center gap-1", trendUp ? "text-green-600" : "text-red-600")}>
                {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trend}
              </p>
            )}
            {children}
          </div>
          <div className={cn("p-3 rounded-lg", color)}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
}

export function AdminMetricCards({
  activeProjects,
  totalProjects,
  totalClients,
  newClientsThisMonth,
  openTasks,
  overdueTasks,
  weeklyProgress,
  budgetUtilization,
}: AdminMetricCardsProps) {
  const cards = [
    {
      title: "Projetos Ativos",
      value: activeProjects,
      subtitle: `de ${totalProjects} projetos totais`,
      icon: Briefcase,
      color: "bg-blue-500",
      trend: "+2 este mês",
      trendUp: true,
      href: "/projects",
    },
    {
      title: "Clientes",
      value: totalClients,
      subtitle: "ativos",
      icon: Building,
      color: "bg-green-500",
      trend: `${newClientsThisMonth} novos este mês`,
      trendUp: true,
      href: "/clients",
    },
    {
      title: "Tarefas Abertas",
      value: openTasks,
      subtitle: overdueTasks > 0 ? `${overdueTasks} atrasadas` : "Tudo em dia",
      icon: CheckSquare,
      color: "bg-amber-500",
      trend: `${weeklyProgress} concluídas esta semana`,
      trendUp: true,
      href: "/projects",
    },
  ];

  const budgetColor = budgetUtilization > 90 ? "bg-red-500" : budgetUtilization > 70 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          custom={i}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <MetricCard {...card} />
        </motion.div>
      ))}

      {/* Budget Card */}
      <motion.div
        custom={3}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <Card className="h-full">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Saúde Financeira</p>
                <p className="text-2xl font-bold mt-1">{budgetUtilization.toFixed(0)}%</p>
                <div className="mt-3">
                  <Progress value={budgetUtilization} className="h-2" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {budgetUtilization > 90 ? (
                    <span className="text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Orçamento crítico
                    </span>
                  ) : budgetUtilization > 70 ? (
                    <span className="text-amber-600">Atenção ao orçamento</span>
                  ) : (
                    <span className="text-green-600">Orçamento saudável</span>
                  )}
                </p>
              </div>
              <div className={cn("p-3 rounded-lg", budgetColor)}>
                <DollarSign className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
