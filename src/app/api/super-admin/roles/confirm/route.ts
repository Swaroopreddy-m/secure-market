import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const rolesConfirmSchema = z.object({
  ids: z.array(z.string().min(1)),
  action: z.enum(["APPROVE", "REJECT", "RETURN"]),
  remarks: z.string().optional().nullable()
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

    // Fetch all Product Admins with pending roles matrix
    const pending = await prisma.user.findMany({
      where: {
        role: "PRODUCT_ADMIN",
        organizationId: orgId,
        roleMatrixStatus: "PENDING"
      },
      include: {
        superAdminPermissions: {
          where: { status: "PENDING_CONFIRMATION" }
        },
        application: {
          select: { name: true }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    const formatted = pending.map((u) => ({
      id: u.id,
      employeeId: u.employeeId,
      username: u.username || "",
      name: u.name || "",
      userApprovalStatus: u.userApprovalStatus || "DRAFT",
      roleMatrixStatus: u.roleMatrixStatus || "DRAFT",
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
      applicationName: u.application?.name || "Unassigned",
      makerUsername: u.superAdminPermissions[0]?.makerUsername || u.makerUsername || "supermaker",
      permissionsCount: u.superAdminPermissions.length,
      superAdminPermissions: u.superAdminPermissions.map(p => ({
        id: p.id,
        module: p.module,
        action: p.action,
        status: p.status
      }))
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("[ROLES_MATRIX_CONFIRM_GET]", error);
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
    const { ids, action, remarks } = rolesConfirmSchema.parse(body);

    if ((action === "REJECT" || action === "RETURN") && (!remarks || !remarks.trim())) {
      return NextResponse.json({ error: `${action} actions require remarks.` }, { status: 400 });
    }

    const checkerUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    const checkerUsername = checkerUser?.username || session.user.name || "superchecker";

    let updatedCount = 0;

    for (const id of ids) {
      const user = await prisma.user.findFirst({
        where: { id, role: "PRODUCT_ADMIN", organizationId: orgId },
        include: { superAdminPermissions: true }
      });

      if (!user) continue;

      const firstPending = user.superAdminPermissions.find(p => p.status === "PENDING_CONFIRMATION");
      const makerUsername = firstPending?.makerUsername || user.makerUsername || "supermaker";

      // Banking Rule: Maker cannot check own submissions
      if (makerUsername === checkerUsername) {
        return NextResponse.json({ 
          error: `Security Policy Violation: You cannot approve/reject/return permissions because you originally submitted them for Product Admin (${user.username}).` 
        }, { status: 400 });
      }

      let nextPermStatus = "DRAFT";
      let nextMatrixStatus = "DRAFT";

      if (action === "APPROVE") {
        nextPermStatus = "APPROVED";
        nextMatrixStatus = "APPROVED";
      } else if (action === "REJECT") {
        nextPermStatus = "REJECTED";
        nextMatrixStatus = "REJECTED";
      } else if (action === "RETURN") {
        nextPermStatus = "RETURNED";
        nextMatrixStatus = "RETURNED";
      }

      await prisma.$transaction(async (tx) => {
        // 1. Update permissions status
        await tx.superAdminPermission.updateMany({
          where: {
            userId: id,
            status: "PENDING_CONFIRMATION"
          },
          data: {
            status: nextPermStatus,
            remarks: remarks || "",
            checkerUsername
          }
        });

        // 2. Promotion Check
        let nextUserStatus = "PENDING";
        if (action === "APPROVE" && user.userApprovalStatus === "APPROVED") {
          nextUserStatus = "ACTIVE";
        }

        // 3. Compile approved permissions list
        let departmentVal = user.department || "";
        if (action === "APPROVE") {
          const approved = await tx.superAdminPermission.findMany({
            where: { userId: id, status: "APPROVED" }
          });
          const modules = Array.from(new Set(approved.map(p => p.module.toLowerCase())));
          departmentVal = modules.join(",");
        }

        // 4. Update Product Admin user
        await tx.user.update({
          where: { id },
          data: {
            roleMatrixStatus: nextMatrixStatus,
            status: nextUserStatus,
            department: departmentVal,
            remarks: remarks || user.remarks || "",
            checkerUsername
          }
        });
      });

      // Write Audit Log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: `PRODUCT_ADMIN_MATRIX_${action}`,
          module: "ROLES",
          status: "SUCCESS",
          details: `Checker ${action} role matrix for Product Admin ${user.username} (${user.employeeId}). Remarks: ${remarks || "None"}. User active: ${action === "APPROVE" && user.userApprovalStatus === "APPROVED"}`
        }
      });

      updatedCount++;
    }

    return NextResponse.json({ success: true, count: updatedCount });
  } catch (error) {
    console.error("[ROLES_MATRIX_CONFIRM_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
