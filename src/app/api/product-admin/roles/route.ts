import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const rolesSaveSchema = z.object({
  userId: z.string().min(1),
  permissions: z.array(z.object({
    module: z.string().min(1),
    action: z.string().min(1)
  })),
  submitStatus: z.enum(["DRAFT", "PENDING"])
});

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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Merchant User ID is required" }, { status: 400 });
    }

    // Verify user belongs to same tenant and application
    const merchantUser = await prisma.user.findFirst({
      where: {
        id: userId,
        role: "USER",
        organizationId: adminUser.organizationId,
        applicationId: adminUser.applicationId
      }
    });

    if (!merchantUser) {
      return NextResponse.json({ error: "Merchant User not found or outside tenant scope" }, { status: 404 });
    }

    // 1. Fetch Product Admin's own approved permissions (what they possess and can assign)
    const productAdminPerms = await prisma.superAdminPermission.findMany({
      where: { userId: session.user.id, status: "APPROVED" }
    });

    // 2. Fetch Merchant User's currently assigned permissions
    const merchantUserPerms = await prisma.superAdminPermission.findMany({
      where: { userId }
    });

    return NextResponse.json({
      productAdminPermissions: productAdminPerms.map(p => ({ module: p.module, action: p.action })),
      merchantUserPermissions: merchantUserPerms.map(p => ({ module: p.module, action: p.action, status: p.status }))
    });
  } catch (error) {
    console.error("[MERCHANT_ROLES_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { userId, permissions, submitStatus } = rolesSaveSchema.parse(body);

    const merchantUser = await prisma.user.findFirst({
      where: {
        id: userId,
        role: "USER",
        organizationId: adminUser.organizationId,
        applicationId: adminUser.applicationId
      }
    });

    if (!merchantUser) {
      return NextResponse.json({ error: "Merchant User not found or outside tenant scope" }, { status: 404 });
    }

    // Load configurations
    const checkerEnabled = (await prisma.configuration.findUnique({ where: { key: "MAKER_CHECKER_CHECKER_ENABLED" } }))?.value === "true";

    // Business Rule Validation: Product Admin can only assign permissions he possesses
    const productAdminPerms = await prisma.superAdminPermission.findMany({
      where: { userId: session.user.id, status: "APPROVED" }
    });

    const hasPossession = (module: string, action: string) => {
      return productAdminPerms.some(
        p => p.module.toLowerCase() === module.toLowerCase() && p.action.toLowerCase() === action.toLowerCase()
      );
    };

    for (const p of permissions) {
      if (!hasPossession(p.module, p.action)) {
        return NextResponse.json({
          error: `Security Violation: You cannot assign permission [${p.module} - ${p.action}] because you do not possess it.`
        }, { status: 403 });
      }
    }

    const makerUsername = adminUser.username || session.user.name || "prodmaker";

    // Determine permission status based on Maker-Checker settings
    let permissionStatus = "DRAFT";
    let roleMatrixStatus = "DRAFT";

    if (checkerEnabled) {
      permissionStatus = submitStatus === "PENDING" ? "PENDING_CONFIRMATION" : "DRAFT";
      roleMatrixStatus = submitStatus;
    } else {
      // Auto-approve if checker is disabled
      permissionStatus = "APPROVED";
      roleMatrixStatus = "APPROVED";
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete all existing permissions for the Merchant User
      await tx.superAdminPermission.deleteMany({
        where: { userId }
      });

      // 2. Create new permissions
      if (permissions.length > 0) {
        await tx.superAdminPermission.createMany({
          data: permissions.map(p => ({
            userId,
            module: p.module,
            action: p.action,
            status: permissionStatus,
            makerUsername
          }))
        });
      }

      // 3. Promote Merchant User to ACTIVE if both User account approval AND Roles Matrix are APPROVED
      let nextUserStatus = merchantUser.status;
      if (roleMatrixStatus === "APPROVED" && merchantUser.userApprovalStatus === "APPROVED") {
        nextUserStatus = "ACTIVE";
      }

      // 4. Update the department field to serialize active modules if APPROVED
      let departmentVal = merchantUser.department || "";
      if (roleMatrixStatus === "APPROVED") {
        const modules = Array.from(new Set(permissions.map(p => p.module.toLowerCase())));
        departmentVal = modules.join(",");
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          roleMatrixStatus,
          status: nextUserStatus,
          department: departmentVal
        }
      });
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: roleMatrixStatus === "APPROVED" ? "MERCHANT_ROLES_AUTO_APPROVED" : (submitStatus === "PENDING" ? "MERCHANT_ROLES_SUBMITTED" : "MERCHANT_ROLES_SAVED"),
        module: "ROLES",
        status: "SUCCESS",
        details: `Maker saved roles matrix for Merchant User ${merchantUser.username}. Status: ${roleMatrixStatus}. Total permissions: ${permissions.length}`
      }
    });

    return NextResponse.json({ success: true, count: permissions.length });
  } catch (error) {
    console.error("[MERCHANT_ROLES_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
