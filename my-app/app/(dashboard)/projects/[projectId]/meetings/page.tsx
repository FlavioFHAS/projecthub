import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyProjectAccess } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { MeetingsClient } from "@/components/meetings/MeetingsClient";

async function getMeetings(projectId: string, userRole: string) {
  const where: any = { projectId };
  
  // CLIENT only sees meetings visible to client
  if (userRole === "CLIENT") {
    where.isVisibleToClient = true;
  }

  const meetings = await prisma.meeting.findMany({
    where,
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: { date: "desc" },
  });

  return meetings;
}

interface Props {
  params: { projectId: string };
}

export default async function MeetingsPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const hasAccess = await verifyProjectAccess(
    params.projectId,
    session.user.id,
    session.user.role
  );
  if (!hasAccess) redirect("/projects");

  const meetings = await getMeetings(params.projectId, session.user.role);

  return <MeetingsClient initialMeetings={meetings as any} />;
}
