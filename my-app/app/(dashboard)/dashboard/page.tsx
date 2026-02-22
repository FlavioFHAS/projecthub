import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.role) {
    redirect("/login");
  }

  const roleRoutes: Record<string, string> = {
    SUPER_ADMIN: "/dashboard/admin",
    ADMIN: "/dashboard/admin",
    COLLABORATOR: "/dashboard/collaborator",
    CLIENT: "/dashboard/client",
  };

  const targetRoute = roleRoutes[session.user.role];

  if (!targetRoute) {
    redirect("/projects");
  }

  redirect(targetRoute);
}
