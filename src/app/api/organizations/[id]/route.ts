import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const orgUpdateSchema = z.object({
  name: z.string().min(1, "Organization name is required").optional(),
  logo: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  subscription: z.string().optional(),
  theme: z.string().optional(),
  status: z.string().optional(), // ACTIVE, INACTIVE, SUSPENDED, DEACTIVATED
  owner: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  domain: z.string().optional().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "DEVELOPER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = orgUpdateSchema.parse(body);

    const updateData: any = { ...data };
    if (data.expiryDate !== undefined) {
      updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
    }

    // If status is changed to SUSPENDED, DEACTIVATED, or INACTIVE, we should also lock/deactivate the Super Admin or users?
    // The requirement says:
    // Developer should be able to: Create Organization, Edit Organization, Delete Organization, Deactivate Organization, Activate Organization, Suspend Organization, Restore Organization.
    // If we update the organization status, that is sufficient. We will update the status of the organization.
    
    const updatedOrg = await prisma.organization.update({
      where: { id },
      data: updateData
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_ORGANIZATION",
        module: "ORGANIZATIONS",
        status: "SUCCESS",
        details: `Updated Organization ${updatedOrg.name} (${id}). Status: ${updatedOrg.status}`
      }
    });

    return NextResponse.json(updatedOrg);
  } catch (error) {
    console.error("[ORGANIZATION_PATCH]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "DEVELOPER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if organization exists
    const org = await prisma.organization.findUnique({
      where: { id }
    });

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Delete in transaction to avoid foreign key violations
    await prisma.$transaction(async (tx) => {
      // 1. Delete order items
      await tx.orderItem.deleteMany({
        where: { order: { organizationId: id } }
      });
      // 2. Delete orders
      await tx.order.deleteMany({
        where: { organizationId: id }
      });
      // 3. Delete store products
      await tx.storeProduct.deleteMany({
        where: { organizationId: id }
      });
      // 4. Delete shops
      await tx.shop.deleteMany({
        where: { organizationId: id }
      });
      // 5. Delete applications
      await tx.application.deleteMany({
        where: { organizationId: id }
      });
      // 6. Delete customers
      await tx.customer.deleteMany({
        where: { organizationId: id }
      });
      
      // 7. Delete users related tables like sessions and accounts
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

      // 8. Delete users
      await tx.user.deleteMany({
        where: { organizationId: id }
      });

      // 9. Delete organization
      await tx.organization.delete({
        where: { id }
      });
    });

    // Write audit log (note: session user is developer, who is NOT deleted since they are not in the deleted organization)
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE_ORGANIZATION",
        module: "ORGANIZATIONS",
        status: "SUCCESS",
        details: `Deleted Organization ${org.name} (${id}) and all its tenant data`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ORGANIZATION_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
