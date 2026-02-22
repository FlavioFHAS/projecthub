import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withRole } from "@/lib/middleware";
import { UserRole } from "@prisma/client";
import { updateUserSchema, changePasswordSchema } from "@/lib/validations";
import { hash, compare } from "bcryptjs";
import {
  parseRequestBody,
  handlePrismaError,
  logAudit,
} from "@/lib/api-helpers";
import { userSelect } from "@/lib/queries/user-queries";

interface Params {
  params: { userId: string };
}

// GET /api/users/[userId] - Obtém detalhes de um usuário
export async function GET(req: NextRequest, { params }: Params) {
  return withAuth(async (req: NextRequest, { user }) => {
    try {
      const { userId } = params;

      // Check permissions
      if (user.role !== "SUPER_ADMIN" && user.id !== userId) {
        // ADMIN can view users they created or users in their projects
        if (user.role === "ADMIN") {
          const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
          });

          if (
            targetUser?.role === "SUPER_ADMIN" ||
            targetUser?.role === "ADMIN"
          ) {
            return NextResponse.json(
              {
                success: false,
                message: "Você não tem permissão para visualizar este usuário",
              },
              { status: 403 }
            );
          }
        } else {
          return NextResponse.json(
            {
              success: false,
              message: "Você não tem permissão para visualizar este usuário",
            },
            { status: 403 }
          );
        }
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: userId, isActive: true },
        select: {
          ...userSelect,
          projects: {
            where: { isActive: true },
            select: {
              id: true,
              role: true,
              project: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                  client: { select: { name: true } },
                },
              },
            },
          },
          _count: {
            select: {
              assignedTasks: true,
              comments: true,
            },
          },
        },
      });

      if (!targetUser) {
        return NextResponse.json(
          { success: false, message: "Usuário não encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: true, data: targetUser },
        { status: 200 }
      );
    } catch (error) {
      console.error("[USER_GET]", error);
      return handlePrismaError(error);
    }
  })(req);
}

// PATCH /api/users/[userId] - Atualiza um usuário
export async function PATCH(req: NextRequest, { params }: Params) {
  return withAuth(
    withRole(["SUPER_ADMIN", "ADMIN"], async (req: NextRequest, { user }) => {
      try {
        const { userId } = params;

        // Parse and validate body
        const bodyResult = await parseRequestBody(req, updateUserSchema);
        if ("error" in bodyResult) return bodyResult.error;

        const data = bodyResult.data;

        // Check if user exists
        const targetUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, role: true, email: true },
        });

        if (!targetUser) {
          return NextResponse.json(
            { success: false, message: "Usuário não encontrado" },
            { status: 404 }
          );
        }

        // Check permissions
        if (user.role === "ADMIN") {
          // ADMIN cannot edit SUPER_ADMIN or other ADMINs
          if (
            targetUser.role === "SUPER_ADMIN" ||
            (targetUser.role === "ADMIN" && targetUser.id !== user.id)
          ) {
            return NextResponse.json(
              {
                success: false,
                message: "Você não tem permissão para editar este usuário",
              },
              { status: 403 }
            );
          }

          // ADMIN cannot change role to SUPER_ADMIN or ADMIN
          if (data.role && ["SUPER_ADMIN", "ADMIN"].includes(data.role)) {
            return NextResponse.json(
              {
                success: false,
                message: "Você não pode atribuir este perfil",
              },
              { status: 403 }
            );
          }
        }

        // Check email uniqueness if changing email
        if (data.email && data.email !== targetUser.email) {
          const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
          });

          if (existingUser) {
            return NextResponse.json(
              {
                success: false,
                message: "Este email já está em uso",
                errors: { email: ["Este email já está cadastrado"] },
              },
              { status: 409 }
            );
          }
        }

        // Update user
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            ...(data.name && { name: data.name }),
            ...(data.email && { email: data.email }),
            ...(data.role && { role: data.role }),
            ...(data.department !== undefined && { department: data.department }),
            ...(data.position !== undefined && { position: data.position }),
            ...(data.phone !== undefined && { phone: data.phone }),
            ...(data.jobTitle !== undefined && { jobTitle: data.jobTitle }),
            ...(data.avatar !== undefined && { avatar: data.avatar }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
          },
          select: userSelect,
        });

        // Log audit
        await logAudit({
          action: "USER_UPDATE",
          userId: user.id,
          targetType: "USER",
          targetId: userId,
          metadata: {
            updatedFields: Object.keys(data),
          },
        });

        return NextResponse.json(
          {
            success: true,
            data: updatedUser,
            message: "Usuário atualizado com sucesso",
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("[USER_PATCH]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}

// DELETE /api/users/[userId] - Desativa um usuário (soft delete)
export async function DELETE(req: NextRequest, { params }: Params) {
  return withAuth(
    withRole(["SUPER_ADMIN", "ADMIN"], async (req: NextRequest, { user }) => {
      try {
        const { userId } = params;

        // Prevent self-deletion
        if (user.id === userId) {
          return NextResponse.json(
            {
              success: false,
              message: "Você não pode desativar sua própria conta",
            },
            { status: 400 }
          );
        }

        // Check if user exists
        const targetUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, role: true, isActive: true },
        });

        if (!targetUser) {
          return NextResponse.json(
            { success: false, message: "Usuário não encontrado" },
            { status: 404 }
          );
        }

        if (!targetUser.isActive) {
          return NextResponse.json(
            { success: false, message: "Usuário já está desativado" },
            { status: 400 }
          );
        }

        // Check permissions
        if (user.role === "ADMIN") {
          // ADMIN cannot delete SUPER_ADMIN or other ADMINs
          if (targetUser.role === "SUPER_ADMIN" || targetUser.role === "ADMIN") {
            return NextResponse.json(
              {
                success: false,
                message: "Você não tem permissão para desativar este usuário",
              },
              { status: 403 }
            );
          }
        }

        // Soft delete - deactivate user
        await prisma.user.update({
          where: { id: userId },
          data: {
            isActive: false,
            email: `${targetUser.id}_deleted_${Date.now()}@deleted.com`,
          },
        });

        // Deactivate project memberships
        await prisma.projectMember.updateMany({
          where: { userId },
          data: { isActive: false },
        });

        // Log audit
        await logAudit({
          action: "USER_DELETE",
          userId: user.id,
          targetType: "USER",
          targetId: userId,
          metadata: {
            deletedUserRole: targetUser.role,
          },
        });

        return NextResponse.json(
          {
            success: true,
            message: "Usuário desativado com sucesso",
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("[USER_DELETE]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}
