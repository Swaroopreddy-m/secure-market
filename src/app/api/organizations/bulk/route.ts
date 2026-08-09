import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const bulkStatusSchema = z.object({
  ids: z.array(z.string().min(1)),
  status: z.string().optional(), // ACTIVE, DEACTIVATED, SUSPENDED
  action: z.enum(["STATUS", "DELETE"])
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "DEVELOPER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = bulkStatusSchema.parse(body);

    if (data.action === "STATUS" && data.status) {
      // Bulk update status
      const updated = await prisma.organization.updateMany({
        where: { id: { in: data.ids } },
        data: { status: data.status }
      });

      // Write audit log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: `BULK_STATUS_${data.status}`,
          module: "ORGANIZATIONS",
          status: "SUCCESS",
          details: `Bulk updated status of ${updated.count} organizations to ${data.status}`
        }
      });

      return NextResponse.json({ success: true, count: updated.count });
    } else if (data.action === "DELETE") {
      // Bulk delete in transaction for each organization to clean related tables
      let deletedCount = 0;

      for (const id of data.ids) {
        try {
          await prisma.$transaction(async (tx) => {
            // Delete order items
            await tx.orderItem.deleteMany({
              where: { order: { organizationId: id } }
            });
            // Delete orders
            await tx.order.deleteMany({
              where: { organizationId: id }
            });
            // Delete store products
            await tx.storeProduct.deleteMany({
              where: { organizationId: id }
            });
            // Delete shops
            await tx.shop.deleteMany({
              where: { organizationId: id }
            });
            // Delete applications
            await tx.application.deleteMany({
              where: { organizationId: id }
            });
            // Delete customers
            await tx.customer.deleteMany({
              where: { organizationId: id }
            });

            // Delete merchant products and associated tables
            const orgMerchantProductIds = (await tx.merchantProduct.findMany({
              where: { organizationId: id },
              select: { id: true }
            })).map(p => p.id);

            await tx.merchantProductHistory.deleteMany({
              where: { productId: { in: orgMerchantProductIds } }
            });
            await tx.merchantInventory.deleteMany({
              where: { organizationId: id }
            });
            await tx.merchantPrice.deleteMany({
              where: { organizationId: id }
            });
            await tx.merchantImage.deleteMany({
              where: { organizationId: id }
            });
            await tx.merchantProduct.deleteMany({
              where: { organizationId: id }
            });
            await tx.merchantCategory.deleteMany({
              where: { organizationId: id }
            });
            
            const orgUserIds = (await tx.user.findMany({
              where: { organizationId: id },
              select: { id: true }
            })).map(u => u.id);

            await tx.session.deleteMany({
              where: { userId: { in: orgUserIds } }
            });
            await tx.account.deleteMany({
              where: { userId: { in: orgUserIds } }
            });
            await tx.activeSession.deleteMany({
              where: { userId: { in: orgUserIds } }
            });
            await tx.auditLog.deleteMany({
              where: { userId: { in: orgUserIds } }
            });
            await tx.activityLog.deleteMany({
              where: { userId: { in: orgUserIds } }
            });
            await tx.notification.deleteMany({
              where: { userId: { in: orgUserIds } }
            });
            await tx.user.deleteMany({
              where: { organizationId: id }
            });
            await tx.organization.delete({
              where: { id }
            });
          });
          deletedCount++;
        } catch (e) {
          console.error(`Failed to delete organization ${id} in bulk:`, e);
        }
      }

      // Write audit log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "BULK_DELETE_ORGANIZATIONS",
          module: "ORGANIZATIONS",
          status: "SUCCESS",
          details: `Bulk deleted ${deletedCount} organizations and their associated data`
        }
      });

      return NextResponse.json({ success: true, count: deletedCount });
    }

    return NextResponse.json({ error: "Invalid action or parameters" }, { status: 400 });
  } catch (error) {
    console.error("[ORGANIZATIONS_BULK_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
