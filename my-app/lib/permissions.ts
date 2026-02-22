import { prisma } from "./prisma";

export async function verifyProjectAccess(
  projectId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  // SUPER_ADMIN tem acesso a tudo
  if (userRole === "SUPER_ADMIN") return true;

  // Verificar se é membro do projeto ou dono
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      ownerId: true,
      members: {
        where: { userId },
        select: { id: true },
      },
    },
  });

  if (!project) return false;

  // É o dono do projeto
  if (project.ownerId === userId) return true;

  // É membro do projeto
  if (project.members.length > 0) return true;

  // Verificar se o projeto é público
  const isPublic = await prisma.project.findUnique({
    where: { id: projectId },
    select: { isPublic: true },
  });

  return isPublic?.isPublic || false;
}

export function hasProjectPermission(
  userRole: string,
  memberRole: string | null,
  permission: string
): boolean {
  // SUPER_ADMIN tem todas as permissões
  if (userRole === "SUPER_ADMIN") return true;

  // ADMIN tem permissões de gerenciamento
  if (userRole === "ADMIN") {
    const adminPermissions = [
      "project:edit",
      "project:delete",
      "member:manage",
      "section:manage",
      "task:manage",
      "meeting:manage",
      "proposal:manage",
      "cost:manage",
      "note:manage",
    ];
    return adminPermissions.includes(permission);
  }

  // COLLABORATOR - permissões limitadas
  if (userRole === "COLLABORATOR") {
    const collaboratorPermissions = [
      "project:view",
      "task:view",
      "task:create",
      "task:edit",
      "meeting:view",
      "note:view",
      "note:create",
      "note:edit",
    ];
    return collaboratorPermissions.includes(permission);
  }

  // CLIENT - apenas visualização
  if (userRole === "CLIENT") {
    const clientPermissions = ["project:view", "task:view", "meeting:view"];
    return clientPermissions.includes(permission);
  }

  // Verificar permissões customizadas do membro
  if (memberRole) {
    // Implementar lógica de permissões customizadas aqui
  }

  return false;
}

export function canManageProject(userRole: string): boolean {
  return userRole === "SUPER_ADMIN" || userRole === "ADMIN";
}

export function canReorderSections(userRole: string): boolean {
  return userRole === "SUPER_ADMIN" || userRole === "ADMIN";
}

export function canAddSection(userRole: string): boolean {
  return userRole === "SUPER_ADMIN" || userRole === "ADMIN";
}

export function canDeleteProject(userRole: string): boolean {
  return userRole === "SUPER_ADMIN";
}

export function canArchiveProject(userRole: string): boolean {
  return userRole === "SUPER_ADMIN" || userRole === "ADMIN";
}

export async function checkProjectPermissions(
  projectId: string,
  userId: string
): Promise<{ canView: boolean; canManage: boolean }> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        where: { userId },
        include: {
          user: {
            select: { role: true },
          },
        },
      },
    },
  });

  if (!project) {
    return { canView: false, canManage: false };
  }

  const isOwner = project.ownerId === userId;
  const member = project.members[0];
  const userRole = member?.user.role;

  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const isAdmin = userRole === "ADMIN";
  const isCollaborator = userRole === "COLLABORATOR";
  const isClient = userRole === "CLIENT";

  const canView =
    isOwner ||
    isSuperAdmin ||
    isAdmin ||
    isCollaborator ||
    isClient ||
    project.isPublic;

  const canManage = isOwner || isSuperAdmin || isAdmin;

  return { canView, canManage };
}
