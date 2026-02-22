import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import {
  getClientProjects,
  getClientMeetings,
  getClientProposals,
} from "@/lib/dashboard/dashboard-queries";
import { ClientDashboard } from "@/components/dashboard/client/ClientDashboard";

export const metadata: Metadata = {
  title: "Meus Projetos",
  description: "Acompanhe o progresso dos seus projetos",
};

export default async function ClientDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userRole = session.user.role;

  // Only CLIENT can access
  if (userRole !== "CLIENT") {
    redirect("/dashboard");
  }

  const userId = session.user.id;

  // Fetch client data
  const [myProjects, upcomingMeetings, recentProposals] = await Promise.all([
    getClientProjects(userId),
    getClientMeetings(userId, 5),
    getClientProposals(userId, 3),
  ]);

  return (
    <ClientDashboard
      user={session.user}
      myProjects={myProjects}
      upcomingMeetings={upcomingMeetings}
      recentProposals={recentProposals}
    />
  );
}
