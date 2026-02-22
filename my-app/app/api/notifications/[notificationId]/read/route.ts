import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware";
import { handlePrismaError } from "@/lib/api-helpers";

interface Params {
  params: { notificationId: string };
}

// PATCH /api/notifications/[notificationId]/read
export async function PATCH(req: NextRequest, { params }: Params) {
  return withAuth(async (req: NextRequest, { user }) => {
    try {
      const { notificationId } = params;

      // Verify notification belongs to user
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId: user.id,
        },
      });

      if (!notification) {
        return NextResponse.json(
          { success: false, message: "Notificação não encontrada" },
          { status: 404 }
        );
      }

      if (notification.isRead) {
        return NextResponse.json(
          { success: false, message: "Notificação já está marcada como lida" },
          { status: 400 }
        );
      }

      // Mark as read
      const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: updated,
          message: "Notificação marcada como lida",
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("[NOTIFICATION_READ]", error);
      return handlePrismaError(error);
    }
  })(req);
}
