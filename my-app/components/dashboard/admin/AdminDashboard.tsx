"use client";

import React from "react";
import { motion } from "framer-motion";
import { AdminMetricCards } from "./AdminMetricCards";
import { ProjectsByStatusChart } from "./ProjectsByStatusChart";
import { WeeklyActivityChart } from "./WeeklyActivityChart";
import { ActiveProjectsTable } from "./ActiveProjectsTable";
import { OverdueItemsPanel } from "./OverdueItemsPanel";
import { UpcomingMeetingsPanel } from "./UpcomingMeetingsPanel";
import { FinancialSummary } from "./FinancialSummary";
import { DashboardGreeting } from "../shared/DashboardGreeting";
import { RecentActivityFeed } from "./RecentActivityFeed";

interface AdminDashboardProps {
  user: any;
  projectStats: {
    total: number;
    byStatus: Record<string, number>;
    active: number;
  };
  clientStats: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  userStats: {
    total: number;
    active: number;
  };
  taskStats: {
    total: number;
    open: number;
    overdue: number;
    completedThisWeek: number;
  };
  costStats: {
    totalActual: number;
    totalPending: number;
    totalApproved: number;
    pendingCount: number;
  };
  weeklyActivity: { day: string; count: number }[];
  upcomingMeetings: any[];
  overdueItems: {
    tasks: any[];
    pendingCosts: any[];
  };
  activeProjects: any[];
  recentActivity: any[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function AdminDashboard({
  user,
  projectStats,
  clientStats,
  userStats,
  taskStats,
  costStats,
  weeklyActivity,
  upcomingMeetings,
  overdueItems,
  activeProjects,
  recentActivity,
}: AdminDashboardProps) {
  const budgetUtilization = costStats.totalApproved > 0 
    ? (costStats.totalActual / costStats.totalApproved) * 100 
    : 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Greeting */}
      <motion.div variants={itemVariants}>
        <DashboardGreeting
          user={user}
          summary="Visão geral dos seus projetos"
        />
      </motion.div>

      {/* Metric Cards */}
      <motion.div variants={itemVariants}>
        <AdminMetricCards
          activeProjects={projectStats.active}
          totalProjects={projectStats.total}
          totalClients={clientStats.active}
          newClientsThisMonth={clientStats.newThisMonth}
          openTasks={taskStats.open}
          overdueTasks={taskStats.overdue}
          weeklyProgress={taskStats.completedThisWeek}
          budgetUtilization={budgetUtilization}
        />
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <ProjectsByStatusChart data={projectStats.byStatus} total={projectStats.total} />
        </motion.div>
        <motion.div variants={itemVariants}>
          <WeeklyActivityChart data={weeklyActivity} />
        </motion.div>
      </div>

      {/* Active Projects Table */}
      <motion.div variants={itemVariants}>
        <ActiveProjectsTable projects={activeProjects} />
      </motion.div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <OverdueItemsPanel
            overdueTasks={overdueItems.tasks}
            pendingCosts={overdueItems.pendingCosts}
          />
        </motion.div>
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <UpcomingMeetingsPanel meetings={upcomingMeetings} />
        </motion.div>
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <RecentActivityFeed activities={recentActivity} />
        </motion.div>
      </div>

      {/* Financial Summary */}
      <motion.div variants={itemVariants}>
        <FinancialSummary
          totalActual={costStats.totalActual}
          totalPending={costStats.totalPending}
          totalApproved={costStats.totalApproved}
          pendingCount={costStats.pendingCount}
        />
      </motion.div>
    </motion.div>
  );
}
