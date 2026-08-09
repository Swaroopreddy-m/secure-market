import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const roleMatrixSaveSchema = z.object({
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

    if (!session || !["SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    if (!orgId) {
      return NextResponse.json({ error: "No organization associated with this account" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Product Admin ID is required" }, { status: 400 });
    }

    // Verify Product Admin belongs to Super Admin's organization
    const productAdmin = await prisma.user.findFirst({
      where: { id: userId, role: "PRODUCT_ADMIN", organizationId: orgId }
    });

    if (!productAdmin) {
      return NextResponse.json({ error: "Product Admin not found" }, { status: 404 });
    }

    // 1. Fetch Super Admin's own approved permissions
    const superAdminPerms = await prisma.superAdminPermission.findMany({
      where: { userId: session.user.id, status: "APPROVED" }
    });

    // 2. Fetch Product Admin's currently assigned permissions
    const productAdminPerms = await prisma.superAdminPermission.findMany({
      where: { userId }
    });

    return NextResponse.json({
      superAdminPermissions: superAdminPerms.map(p => ({ module: p.module, action: p.action })),
      productAdminPermissions: productAdminPerms.map(p => ({ module: p.module, action: p.action, status: p.status }))
    });
  } catch (error) {
    console.error("[ROLES_MATRIX_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    if (!orgId) {
      return NextResponse.json({ error: "No organization associated with this account" }, { status: 400 });
    }

    const body = await request.json();
    const { userId, permissions, submitStatus } = roleMatrixSaveSchema.parse(body);

    const productAdmin = await prisma.user.findFirst({
      where: { id: userId, role: "PRODUCT_ADMIN", organizationId: orgId }
    });

    if (!productAdmin) {
      return NextResponse.json({ error: "Product Admin not found" }, { status: 404 });
    }

    // Business Rule: Super Admin can assign ONLY permissions he owns (approved by Developer)
    const superAdminPerms = await prisma.superAdminPermission.findMany({
      where: { userId: session.user.id, status: "APPROVED" }
    });

    const superAdminHas = (module: string, action: string) => {
      return superAdminPerms.some(p => p.module.toLowerCase() === module.toLowerCase() && p.action.toLowerCase() === action.toLowerCase());
    };

    for (const p of permissions) {
      if (!superAdminHas(p.module, p.action)) {
        return NextResponse.json({ 
          error: `Security Policy Violation: You cannot assign permission [${p.module} - ${p.action}] because you do not possess it.` 
        }, { status: 403 });
      }
    }

    const creatorUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    const makerUsername = creatorUser?.username || session.user.name || "supermaker";

    const checkerConfig = await prisma.configuration.findUnique({ where: { key: "MAKER_CHECKER_CHECKER_ENABLED" } });
    const checkerEnabled = checkerConfig?.value !== "false";

    let permissionStatus = "DRAFT";
    let roleMatrixStatus = "DRAFT";

    if (checkerEnabled) {
      permissionStatus = submitStatus === "PENDING" ? "PENDING_CONFIRMATION" : "DRAFT";
      roleMatrixStatus = submitStatus;
    } else {
      permissionStatus = "APPROVED";
      roleMatrixStatus = "APPROVED";
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete all existing permissions for the Product Admin
      await tx.superAdminPermission.deleteMany({
        where: { userId }
      });

      // 2. Insert new permissions in correct status
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

      // 3. Update Product Admin's role matrix status and status promotion
      let nextUserStatus = productAdmin.status;
      if (roleMatrixStatus === "APPROVED" && productAdmin.userApprovalStatus === "APPROVED") {
        nextUserStatus = "ACTIVE";
      }

      // Update the department field to serialize active modules if APPROVED
      let departmentVal = productAdmin.department || "";
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
        action: submitStatus === "PENDING" ? "PRODUCT_ADMIN_MATRIX_SUBMITTED" : "PRODUCT_ADMIN_MATRIX_SAVED",
        module: "ROLES",
        status: "SUCCESS",
        details: `Maker saved role matrix for Product Admin ${productAdmin.username}. Status: ${submitStatus}. Total permissions: ${permissions.length}`
      }
    });

    return NextResponse.json({ success: true, count: permissions.length });
  } catch (error) {
    console.error("[ROLES_MATRIX_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
