import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyProjectAccess } from "@/lib/permissions";
import { TeamClient } from "@/components/team/TeamClient";

async function getTeamData(projectId: string, userRole: string, userId: string) {
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          company: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  // Get available users for adding (only for admins)
  let availableUsers: any[] = [];
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") {
    const existingMemberIds = members.map((m) => m.userId);
    availableUsers = await prisma.user.findMany({
      where: {
        status: "ACTIVE",
        NOT: {
          id: { in: existingMemberIds },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });
  }

  return { members, availableUsers };
}

interface Props {
  params: { projectId: string };
}

export default async function TeamPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const hasAccess = await verifyProjectAccess(
    params.projectId,
    session.user.id,
    session.user.role
  );
  if (!hasAccess) redirect("/projects");

  const { members, availableUsers } = await getTeamData(
    params.projectId,
    session.user.role,
    session.user.id
  );

  return (
    <TeamClient
      initialMembers={members as any}
      availableUsers={availableUsers as any}
      projectId={params.projectId}
      currentUserId={session.user.id}
    />
  );
}
