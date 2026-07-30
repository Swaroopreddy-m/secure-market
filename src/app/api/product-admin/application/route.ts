import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PRODUCT_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!adminUser || !adminUser.organizationId || !adminUser.applicationId) {
      return NextResponse.json({ error: "Product Admin not fully assigned to an application" }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id: adminUser.applicationId }
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Fetch Statistics (Application scoped)
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      pendingUsers,
      pendingRoles,
      productsCount,
      inventorySum,
      ordersCount,
      productsList
    ] = await Promise.all([
      // Total Merchant Users
      prisma.user.count({
        where: { role: "USER", organizationId: adminUser.organizationId, applicationId: adminUser.applicationId }
      }),
      // Active Users
      prisma.user.count({
        where: { role: "USER", organizationId: adminUser.organizationId, applicationId: adminUser.applicationId, status: "ACTIVE" }
      }),
      // Inactive Users (any status that isn't ACTIVE or PENDING)
      prisma.user.count({
        where: {
          role: "USER",
          organizationId: adminUser.organizationId,
          applicationId: adminUser.applicationId,
          status: { in: ["INACTIVE", "LOCKED"] }
        }
      }),
      // Pending Users (userApprovalStatus = PENDING)
      prisma.user.count({
        where: {
          role: "USER",
          organizationId: adminUser.organizationId,
          applicationId: adminUser.applicationId,
          userApprovalStatus: "PENDING"
        }
      }),
      // Pending Role Confirmations
      prisma.user.count({
        where: {
          role: "USER",
          organizationId: adminUser.organizationId,
          applicationId: adminUser.applicationId,
          roleMatrixStatus: "PENDING"
        }
      }),
      // Products Count
      prisma.storeProduct.count({
        where: { organizationId: adminUser.organizationId, applicationId: adminUser.applicationId }
      }),
      // Inventory Count (Sum of stocks)
      prisma.storeProduct.aggregate({
        where: { organizationId: adminUser.organizationId, applicationId: adminUser.applicationId },
        _sum: { stock: true }
      }),
      // Orders Count
      prisma.order.count({
        where: { organizationId: adminUser.organizationId, applicationId: adminUser.applicationId }
      }),
      // Fetch categories from products
      prisma.storeProduct.findMany({
        where: { organizationId: adminUser.organizationId, applicationId: adminUser.applicationId },
        select: { category: true }
      })
    ]);

    const categoriesCount = new Set(productsList.map(p => p.category)).size;

    let settingsObj = { contactPerson: "", contactEmail: "", contactPhone: "", theme: "light" };
    try {
      settingsObj = JSON.parse(application.settings || "{}");
    } catch {
      // Use fallback defaults
    }

    return NextResponse.json({
      id: application.id,
      name: application.name,
      logo: application.logo || "/images/apps/default.png",
      description: application.description || "",
      theme: settingsObj.theme || "light",
      contactPerson: settingsObj.contactPerson || "",
      contactEmail: settingsObj.contactEmail || "",
      contactPhone: settingsObj.contactPhone || "",
      statistics: {
        totalMerchantUsers: totalUsers,
        activeUsers,
        inactiveUsers,
        pendingUsers,
        pendingRoleConfirmations: pendingRoles,
        productsCount,
        inventoryCount: inventorySum._sum.stock || 0,
        ordersCount,
        categoriesCount
      }
    });
  } catch (error) {
    console.error("[APPLICATION_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PRODUCT_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!adminUser || !adminUser.organizationId || !adminUser.applicationId) {
      return NextResponse.json({ error: "Product Admin not fully assigned to an application" }, { status: 400 });
    }

    // Check if Product Admin has Edit permission for "Applications"
    const hasEditPermission = await prisma.superAdminPermission.findFirst({
      where: {
        userId: session.user.id,
        module: "Applications",
        action: "Edit",
        status: "APPROVED"
      }
    });

    if (!hasEditPermission) {
      return NextResponse.json({
        error: "Security Violation: You do not have permission to update Application Information."
      }, { status: 403 });
    }

    const body = await request.json();
    const { name, logo, description, theme, contactPerson, contactEmail, contactPhone } = body;

    const application = await prisma.application.findUnique({
      where: { id: adminUser.applicationId }
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    let settingsObj = {};
    try {
      settingsObj = JSON.parse(application.settings || "{}");
    } catch {
      // Fallback
    }

    const updatedSettings = JSON.stringify({
      ...settingsObj,
      theme: theme || (settingsObj as any).theme || "light",
      contactPerson: contactPerson || (settingsObj as any).contactPerson || "",
      contactEmail: contactEmail || (settingsObj as any).contactEmail || "",
      contactPhone: contactPhone || (settingsObj as any).contactPhone || ""
    });

    const updated = await prisma.application.update({
      where: { id: application.id },
      data: {
        name: name !== undefined ? name : application.name,
        logo: logo !== undefined ? logo : application.logo,
        description: description !== undefined ? description : application.description,
        settings: updatedSettings
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "APPLICATION_UPDATED",
        module: "CONFIG",
        status: "SUCCESS",
        details: `Updated Application profile for ${updated.name}`
      }
    });

    return NextResponse.json({ success: true, application: updated });
  } catch (error) {
    console.error("[APPLICATION_PATCH]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
