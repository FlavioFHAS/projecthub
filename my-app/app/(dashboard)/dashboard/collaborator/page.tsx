import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import {
  getMyTasks,
  getMyProjects,
  getWeeklyTaskStats,
  getUpcomingMeetings,
  getActivityHeatmap,
} from "@/lib/dashboard/dashboard-queries";
import { CollaboratorDashboard } from "@/components/dashboard/collaborator/CollaboratorDashboard";

export const metadata: Metadata = {
  title: "Meu Dashboard",
  description: "Suas tarefas e projetos",
};

export default async function CollaboratorDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userRole = session.user.role;

  // Only COLLABORATOR can access
  if (userRole !== "COLLABORATOR") {
    redirect("/dashboard");
  }

  const userId = session.user.id;

  // Fetch all data in parallel
  const [myTasks, myProjects, weeklyStats, upcomingMeetings, activityHeatmap] =
    await Promise.all([
      getMyTasks(userId),
      getMyProjects(userId),
      getWeeklyTaskStats(userId),
      getUpcomingMeetings(
        { members: { some: { userId } } },
        3
      ),
      getActivityHeatmap(userId, 14),
    ]);

  return (
    <CollaboratorDashboard
      user={session.user}
      myTasks={myTasks}
      myProjects={myProjects}
      weeklyStats={weeklyStats}
      upcomingMeetings={upcomingMeetings}
      activityHeatmap={activityHeatmap}
    />
  );
}
