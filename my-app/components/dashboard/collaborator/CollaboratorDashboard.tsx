"use client";

import React from "react";
import { motion } from "framer-motion";
import { DashboardGreeting } from "../shared/DashboardGreeting";
import { MyWeekStats } from "./MyWeekStats";
import { MyTasksList } from "./MyTasksList";
import { MyProjectsGrid } from "./MyProjectsGrid";
import { MyAgenda } from "./MyAgenda";
import { ActivityHeatmap } from "../shared/ActivityHeatmap";

interface CollaboratorDashboardProps {
  user: any;
  myTasks: any[];
  myProjects: any[];
  weeklyStats: {
    completed: number;
    inProgress: number;
    overdue: number;
    total: number;
  };
  upcomingMeetings: any[];
  activityHeatmap: { date: string; count: number }[];
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

export function CollaboratorDashboard({
  user,
  myTasks,
  myProjects,
  weeklyStats,
  upcomingMeetings,
  activityHeatmap,
}: CollaboratorDashboardProps) {
  const overdueTasks = myTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date()
  );
  const todayTasks = myTasks.filter((t) => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    const today = new Date();
    return (
      due.getDate() === today.getDate() &&
      due.getMonth() === today.getMonth() &&
      due.getFullYear() === today.getFullYear()
    );
  });

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
          summary={`Você tem ${todayTasks.length} tarefa${todayTasks.length !== 1 ? "s" : ""} para hoje`}
        />
      </motion.div>

      {/* Week Stats */}
      <motion.div variants={itemVariants}>
        <MyWeekStats
          completed={weeklyStats.completed}
          inProgress={weeklyStats.inProgress}
          overdue={weeklyStats.overdue}
          total={weeklyStats.total}
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Tasks */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <MyTasksList tasks={myTasks} />
        </motion.div>

        {/* Right Column */}
        <motion.div variants={itemVariants} className="space-y-6">
          <MyProjectsGrid projects={myProjects} />
          <MyAgenda meetings={upcomingMeetings} tasks={todayTasks} />
          <ActivityHeatmap data={activityHeatmap} />
        </motion.div>
      </div>
    </motion.div>
  );
}
