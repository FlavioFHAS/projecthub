import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withRole } from "@/lib/middleware";
import { createClientSchema } from "@/lib/validations";
import {
  parsePaginationParams,
  parseSortParams,
  formatPaginatedResponse,
  parseRequestBody,
  handlePrismaError,
  logAudit,
} from "@/lib/api-helpers";

// GET /api/clients - Lista clientes com paginação e filtros
export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(req.url);

    // Parse pagination
    const { page, pageSize, skip, take } = parsePaginationParams(searchParams);

    // Parse sorting
    const { sortBy, sortOrder } = parseSortParams(
      searchParams,
      ["name", "createdAt", "updatedAt"],
      "createdAt",
      "desc"
    );

    // Parse filters
    const search = searchParams.get("search")?.trim();
    const isActive = searchParams.get("isActive");
    const hasProjects = searchParams.get("hasProjects");

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { document: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== null) where.isActive = isActive === "true";

    // Permission filtering
    if (user.role === "CLIENT") {
      // CLIENT can only see their own client record
      const clientUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { clientId: true },
      });
      where.id = clientUser?.clientId;
    }

    // Execute query
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          document: true,
          logo: true,
          website: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              projects: { where: { isActive: true } },
            },
          },
        },
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.client.count({ where }),
    ]);

    // Filter by hasProjects if specified
    let filteredClients = clients;
    if (hasProjects === "true") {
      filteredClients = clients.filter((c) => c._count.projects > 0);
    } else if (hasProjects === "false") {
      filteredClients = clients.filter((c) => c._count.projects === 0);
    }

    return NextResponse.json(
      formatPaginatedResponse(filteredClients, total, page, pageSize),
      { status: 200 }
    );
  } catch (error) {
    console.error("[CLIENTS_GET]", error);
    return handlePrismaError(error);
  }
});

// POST /api/clients - Cria novo cliente
export const POST = withAuth(
  withRole(["SUPER_ADMIN", "ADMIN", "COLLABORATOR"], async (req: NextRequest, { user }) => {
    try {
      // Parse and validate body
      const bodyResult = await parseRequestBody(req, createClientSchema);
      if ("error" in bodyResult) return bodyResult.error;

      const data = bodyResult.data;

      // Check if email already exists
      const existingClient = await prisma.client.findUnique({
        where: { email: data.email },
      });

      if (existingClient) {
        return NextResponse.json(
          {
            success: false,
            message: "Este email já está em uso",
            errors: { email: ["Este email já está cadastrado"] },
          },
          { status: 409 }
        );
      }

      // Check document uniqueness if provided
      if (data.document) {
        const existingDocument = await prisma.client.findUnique({
          where: { document: data.document },
        });

        if (existingDocument) {
          return NextResponse.json(
            {
              success: false,
              message: "Este documento já está cadastrado",
              errors: { document: ["Este CPF/CNPJ já está em uso"] },
            },
            { status: 409 }
          );
        }
      }

      // Create client
      const newClient = await prisma.client.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          document: data.document,
          website: data.website,
          notes: data.notes,
          isActive: data.isActive ?? true,
          address: data.address
            ? {
                create: {
                  street: data.address.street,
                  number: data.address.number,
                  complement: data.address.complement,
                  neighborhood: data.address.neighborhood,
                  city: data.address.city,
                  state: data.address.state,
                  zipCode: data.address.zipCode,
                  country: data.address.country,
                },
              }
            : undefined,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          document: true,
          logo: true,
          website: true,
          isActive: true,
          createdAt: true,
          address: true,
        },
      });

      // Log audit
      await logAudit({
        action: "CLIENT_CREATE",
        userId: user.id,
        targetType: "CLIENT",
        targetId: newClient.id,
        metadata: {
          clientName: data.name,
          clientEmail: data.email,
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: newClient,
          message: "Cliente criado com sucesso",
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("[CLIENTS_POST]", error);
      return handlePrismaError(error);
    }
  })
);
