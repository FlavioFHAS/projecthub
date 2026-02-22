"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertTriangle, ListTodo, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface MyWeekStatsProps {
  completed: number;
  inProgress: number;
  overdue: number;
  total: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05 },
  }),
};

export function MyWeekStats({ completed, inProgress, overdue, total }: MyWeekStatsProps) {
  const hoursGoal = 40;
  const hoursLogged = Math.min(completed * 2, hoursGoal); // Mock: 2h per task
  const hoursProgress = (hoursLogged / hoursGoal) * 100;

  const stats = [
    {
      title: "Concluídas",
      value: completed,
      subtitle: "esta semana",
      icon: CheckCircle,
      color: "bg-green-500",
      textColor: "text-green-600",
    },
    {
      title: "Em andamento",
      value: inProgress,
      subtitle: `${total} total`,
      icon: Clock,
      color: "bg-blue-500",
      textColor: "text-blue-600",
    },
    {
      title: "Atrasadas",
      value: overdue,
      subtitle: overdue > 0 ? "Precisa de atenção" : "Tudo em dia",
      icon: AlertTriangle,
      color: overdue > 0 ? "bg-red-500" : "bg-gray-500",
      textColor: overdue > 0 ? "text-red-600" : "text-gray-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.title}
          custom={i}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <Card className="h-full">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className={cn("text-2xl font-bold", stat.textColor)}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                </div>
                <div className={cn("p-2 rounded-lg", stat.color)}>
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Hours Card */}
      <motion.div
        custom={3}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Horas logadas</p>
                <p className="text-2xl font-bold">{hoursLogged}h</p>
                <div className="mt-2">
                  <Progress value={hoursProgress} className="h-1.5" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {hoursLogged} de {hoursGoal}h semanais
                </p>
              </div>
              <div className="p-2 rounded-lg bg-orange-500">
                <Flame className="w-4 h-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
