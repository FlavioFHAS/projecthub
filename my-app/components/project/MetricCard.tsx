"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; label: string; positive: boolean };
  variant?: "default" | "warning" | "danger" | "success";
  children?: React.ReactNode;
}

const variantStyles = {
  default: "border-border",
  warning: "border-amber-500/30 bg-amber-500/5",
  danger: "border-red-500/30 bg-red-500/5",
  success: "border-emerald-500/30 bg-emerald-500/5",
};

const iconStyles = {
  default: "text-muted-foreground bg-muted",
  warning: "text-amber-500 bg-amber-500/10",
  danger: "text-red-500 bg-red-500/10",
  success: "text-emerald-500 bg-emerald-500/10",
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
  children,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-xl border p-4 bg-card",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "p-2 rounded-lg",
            iconStyles[variant]
          )}
        >
          {icon}
        </div>
        {trend && (
          <div
            className={cn(
              "text-xs font-medium",
              trend.positive ? "text-emerald-500" : "text-red-500"
            )}
          >
            {trend.positive ? "+" : ""}
            {trend.value}% {trend.label}
          </div>
        )}
      </div>

      <div className="mt-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-bold"
        >
          {value}
        </motion.div>
        <p className="text-sm text-muted-foreground mt-1">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground/70 mt-0.5">{subtitle}</p>
        )}
      </div>

      {children}
    </motion.div>
  );
}
