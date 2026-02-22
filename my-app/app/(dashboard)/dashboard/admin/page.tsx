import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  getProjectStats,
  getClientStats,
  getUserStats,
  getTaskStats,
  getCostStats,
  getWeeklyActivity,
  getUpcomingMeetings,
  getOverdueItems,
  getActiveProjects,
  getRecentActivity,
} from "@/lib/dashboard/dashboard-queries";
import { AdminDashboard } from "@/components/dashboard/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Dashboard Administrativo",
  description: "Visão geral de todos os projetos e métricas",
};

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userRole = session.user.role;

  // Only SUPER_ADMIN and ADMIN can access
  if (!["SUPER_ADMIN", "ADMIN"].includes(userRole)) {
    redirect("/dashboard");
  }

  // Build where clause based on role
  const whereClause =
    userRole === "SUPER_ADMIN"
      ? {}
      : { client: { adminId: session.user.id } };

  // Fetch all data in parallel
  const [
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
  ] = await Promise.all([
    getProjectStats(whereClause),
    getClientStats(session.user),
    getUserStats(session.user),
    getTaskStats(whereClause),
    getCostStats(whereClause),
    getWeeklyActivity(whereClause),
    getUpcomingMeetings(whereClause, 5),
    getOverdueItems(whereClause),
    getActiveProjects(whereClause, 8),
    getRecentActivity(whereClause, 10),
  ]);

  return (
    <AdminDashboard
      user={session.user}
      projectStats={projectStats}
      clientStats={clientStats}
      userStats={userStats}
      taskStats={taskStats}
      costStats={costStats}
      weeklyActivity={weeklyActivity}
      upcomingMeetings={upcomingMeetings}
      overdueItems={overdueItems}
      activeProjects={activeProjects}
      recentActivity={recentActivity}
    />
  );
}
