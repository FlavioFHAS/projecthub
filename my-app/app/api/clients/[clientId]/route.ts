import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withRole, withPermission } from "@/lib/middleware";
import { updateClientSchema } from "@/lib/validations";
import {
  parseRequestBody,
  handlePrismaError,
  logAudit,
  verifyClientAccess,
} from "@/lib/api-helpers";

interface Params {
  params: { clientId: string };
}

// GET /api/clients/[clientId] - Obtém detalhes de um cliente
export async function GET(req: NextRequest, { params }: Params) {
  return withAuth(async (req: NextRequest, { user }) => {
    try {
      const { clientId } = params;

      // Check permissions
      const hasAccess = await verifyClientAccess(clientId, user.id, user.role);
      if (!hasAccess) {
        return NextResponse.json(
          {
            success: false,
            message: "Você não tem permissão para visualizar este cliente",
          },
          { status: 403 }
        );
      }

      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          document: true,
          logo: true,
          website: true,
          notes: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          address: true,
          projects: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              status: true,
              startDate: true,
              endDate: true,
              budget: true,
              color: true,
              _count: {
                select: { tasks: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
          users: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              projects: { where: { isActive: true } },
            },
          },
        },
      });

      if (!client) {
        return NextResponse.json(
          { success: false, message: "Cliente não encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: true, data: client },
        { status: 200 }
      );
    } catch (error) {
      console.error("[CLIENT_GET]", error);
      return handlePrismaError(error);
    }
  })(req);
}

// PATCH /api/clients/[clientId] - Atualiza um cliente
export async function PATCH(req: NextRequest, { params }: Params) {
  return withAuth(
    withRole(["SUPER_ADMIN", "ADMIN", "COLLABORATOR"], async (req: NextRequest, { user }) => {
      try {
        const { clientId } = params;

        // Parse and validate body
        const bodyResult = await parseRequestBody(req, updateClientSchema);
        if ("error" in bodyResult) return bodyResult.error;

        const data = bodyResult.data;

        // Check if client exists
        const existingClient = await prisma.client.findUnique({
          where: { id: clientId },
          select: { id: true, email: true, document: true },
        });

        if (!existingClient) {
          return NextResponse.json(
            { success: false, message: "Cliente não encontrado" },
            { status: 404 }
          );
        }

        // Check email uniqueness if changing
        if (data.email && data.email !== existingClient.email) {
          const emailExists = await prisma.client.findUnique({
            where: { email: data.email },
          });

          if (emailExists) {
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

        // Check document uniqueness if changing
        if (data.document && data.document !== existingClient.document) {
          const documentExists = await prisma.client.findUnique({
            where: { document: data.document },
          });

          if (documentExists) {
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

        // Update client
        const updatedClient = await prisma.client.update({
          where: { id: clientId },
          data: {
            ...(data.name && { name: data.name }),
            ...(data.email && { email: data.email }),
            ...(data.phone !== undefined && { phone: data.phone }),
            ...(data.document !== undefined && { document: data.document }),
            ...(data.website !== undefined && { website: data.website }),
            ...(data.notes !== undefined && { notes: data.notes }),
            ...(data.logo !== undefined && { logo: data.logo }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
            ...(data.address && {
              address: {
                upsert: {
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
                  update: {
                    street: data.address.street,
                    number: data.address.number,
                    complement: data.address.complement,
                    neighborhood: data.address.neighborhood,
                    city: data.address.city,
                    state: data.address.state,
                    zipCode: data.address.zipCode,
                    country: data.address.country,
                  },
                },
              },
            }),
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
            updatedAt: true,
            address: true,
          },
        });

        // Log audit
        await logAudit({
          action: "CLIENT_UPDATE",
          userId: user.id,
          targetType: "CLIENT",
          targetId: clientId,
          metadata: {
            updatedFields: Object.keys(data),
          },
        });

        return NextResponse.json(
          {
            success: true,
            data: updatedClient,
            message: "Cliente atualizado com sucesso",
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("[CLIENT_PATCH]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}

// DELETE /api/clients/[clientId] - Desativa um cliente (soft delete)
export async function DELETE(req: NextRequest, { params }: Params) {
  return withAuth(
    withRole(["SUPER_ADMIN", "ADMIN"], async (req: NextRequest, { user }) => {
      try {
        const { clientId } = params;

        // Check if client exists
        const client = await prisma.client.findUnique({
          where: { id: clientId },
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                projects: { where: { isActive: true } },
              },
            },
          },
        });

        if (!client) {
          return NextResponse.json(
            { success: false, message: "Cliente não encontrado" },
            { status: 404 }
          );
        }

        // Check if client has active projects
        if (client._count.projects > 0) {
          return NextResponse.json(
            {
              success: false,
              message: "Não é possível desativar um cliente com projetos ativos",
            },
            { status: 400 }
          );
        }

        // Soft delete - deactivate client
        await prisma.client.update({
          where: { id: clientId },
          data: {
            isActive: false,
            email: `${clientId}_deleted_${Date.now()}@deleted.com`,
          },
        });

        // Deactivate associated users
        await prisma.user.updateMany({
          where: { clientId },
          data: { isActive: false },
        });

        // Log audit
        await logAudit({
          action: "CLIENT_DELETE",
          userId: user.id,
          targetType: "CLIENT",
          targetId: clientId,
          metadata: {
            clientName: client.name,
          },
        });

        return NextResponse.json(
          {
            success: true,
            message: "Cliente desativado com sucesso",
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("[CLIENT_DELETE]", error);
        return handlePrismaError(error);
      }
    })
  )(req);
}
