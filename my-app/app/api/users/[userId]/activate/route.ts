import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withRole } from "@/lib/middleware";
import { handlePrismaError, logAudit } from "@/lib/api-helpers";

interface Params {
  params: { userId: string };
}

// POST /api/users/[userId]/activate - Reativa um usuário desativado
export async function POST(req: NextRequest, { params }: Params) {
  return withAuth(
    withRole(["SUPER_ADMIN", "ADMIN"], async (req: NextRequest, { user }) => {
      try {
        const { userId } = params;

        // Check if user exists
        const targetUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, role: true, isActive: true, email: true },
        });

        if (!targetUser) {
          return NextResponse.json(
            { success: false, message: "Usuário não encontrado" },
            { status: 404 }
          );
        }

        if (targetUser.isActive) {
          return NextResponse.json(
            { success: false, message: "Usuário já está ativo" },
            { status: 400 }
          );
        }

        // Check permissions
        if (user.role === "ADMIN") {
          // ADMIN cannot reactivate SUPER_ADMIN or other ADMINs
          if (targetUser.role === "SUPER_ADMIN" || targetUser.role === "ADMIN") {
            return NextResponse.json(
              {
                success: false,
                message: "Você não tem permissão para reativar este usuário",
              },
              { status: 403 }
            );
          }
        }

        // Generate new email (remove the deleted prefix if exists)
        const originalEmail = targetUser.email.includes("_deleted_")
          ? targetUser.email.split("_deleted_")[1]?.replace("@deleted.com", "") ||
            `restored_${Date.now()}@example.com`
          : targetUser.email;

        // Check if email is already in use
        const emailExists = await prisma.user.findUnique({
          where: { email: originalEmail },
        });

        const finalEmail = emailExists
          ? `restored_${Date.now()}_${originalEmail}`
          : originalEmail;

        // Reactivate user
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            isActive: true,
            email: finalEmail,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        });

        // Log audit
        await logAudit({
          action: "USER_ACTIVATE",
          userId: user.id,
          targetType: "USER",
          targetId: userId,
          metadata: {
            reactivatedUserRole: targetUser.role,
          },
        });

        return NextResponse.json(
          {
            success: true,
            data: updatedUser,
            message: "Usuário reativado com sucesso",
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("[USER_ACTIVATE]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}
