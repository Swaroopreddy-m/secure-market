import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const orgUpdateSchema = z.object({
  name: z.string().min(1, "Organization name is required").optional(),
  code: z.string().min(1, "Organization code is required").optional(),
  logo: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  subscription: z.string().optional(),
  theme: z.string().optional(),
  status: z.string().optional(), // ACTIVE, INACTIVE, SUSPENDED, DEACTIVATED
  owner: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  domain: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
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
    
    // Fetch existing organization
    const existing = await prisma.organization.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const body = await request.json();
    const data = orgUpdateSchema.parse(body);

    // Verify unique code check
    if (data.code && data.code !== existing.code) {
      const duplicateCode = await prisma.organization.findUnique({
        where: { code: data.code }
      });
      if (duplicateCode) {
        return NextResponse.json({ error: "Organization Code already exists" }, { status: 400 });
      }
    }

    // Verify unique domain check
    if (data.domain && data.domain !== existing.domain) {
      const duplicateDomain = await prisma.organization.findUnique({
        where: { domain: data.domain }
      });
      if (duplicateDomain) {
        return NextResponse.json({ error: "Domain name already registered" }, { status: 400 });
      }
    }

    const updateData: any = { ...data };
    if (data.expiryDate !== undefined) {
      updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
    }
    if (data.domain !== undefined) {
      updateData.domain = data.domain || null;
    }
    
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
  } catch (error: any) {
    console.error("[ORGANIZATION_PATCH]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
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

      // 6b. Delete merchant products and associated tables
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
