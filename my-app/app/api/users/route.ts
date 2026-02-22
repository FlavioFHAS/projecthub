import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withRole } from "@/lib/middleware";
import { UserRole } from "@prisma/client";
import { createUserSchema, updateUserSchema } from "@/lib/validations";
import { hash } from "bcryptjs";
import {
  parsePaginationParams,
  parseSortParams,
  formatPaginatedResponse,
  parseRequestBody,
  handlePrismaError,
  logAudit,
} from "@/lib/api-helpers";
import { userSelect, getUsersWhereClause } from "@/lib/queries/user-queries";

// GET /api/users - Lista usuários com paginação e filtros
export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(req.url);

    // Parse pagination
    const { page, pageSize, skip, take } = parsePaginationParams(searchParams);

    // Parse sorting
    const { sortBy, sortOrder } = parseSortParams(
      searchParams,
      ["name", "email", "role", "createdAt", "lastLoginAt"],
      "createdAt",
      "desc"
    );

    // Parse filters
    const search = searchParams.get("search")?.trim();
    const role = searchParams.get("role") as UserRole | null;
    const isActive = searchParams.get("isActive");
    const department = searchParams.get("department")?.trim();

    // Build where clause based on user permissions
    const extraFilters: any = {};

    if (search) {
      extraFilters.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { jobTitle: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role) extraFilters.role = role;
    if (isActive !== null) extraFilters.isActive = isActive === "true";
    if (department) extraFilters.department = { contains: department, mode: "insensitive" };

    const where = await getUsersWhereClause(user.id, user.role, extraFilters);

    // Execute query
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: userSelect,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json(
      formatPaginatedResponse(users, total, page, pageSize),
      { status: 200 }
    );
  } catch (error) {
    console.error("[USERS_GET]", error);
    return handlePrismaError(error);
  }
});

// POST /api/users - Cria novo usuário
export const POST = withAuth(
  withRole(["SUPER_ADMIN", "ADMIN"], async (req: NextRequest, { user }) => {
    try {
      // Parse and validate body
      const bodyResult = await parseRequestBody(req, createUserSchema);
      if ("error" in bodyResult) return bodyResult.error;

      const data = bodyResult.data;

      // Check permissions for role assignment
      if (user.role === "ADMIN") {
        // ADMIN can only create COLLABORATOR and CLIENT
        if (data.role === "SUPER_ADMIN" || data.role === "ADMIN") {
          return NextResponse.json(
            {
              success: false,
              message: "Você não tem permissão para criar usuários com este perfil",
            },
            { status: 403 }
          );
        }
      }

      // Check if email already exists
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

      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-10);
      const hashedPassword = await hash(tempPassword, 12);

      // Create user
      const newUser = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: data.role,
          department: data.department,
          position: data.position,
          phone: data.phone,
          isActive: data.isActive ?? true,
        },
        select: userSelect,
      });

      // Log audit
      await logAudit({
        action: "USER_CREATE",
        userId: user.id,
        targetType: "USER",
        targetId: newUser.id,
        metadata: {
          createdUserEmail: data.email,
          createdUserRole: data.role,
        },
      });

      // TODO: Send welcome email with temporary password

      return NextResponse.json(
        {
          success: true,
          data: newUser,
          message: "Usuário criado com sucesso",
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("[USERS_POST]", error);
      return handlePrismaError(error);
    }
  })
);
