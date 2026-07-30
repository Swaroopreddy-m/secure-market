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

    if (!session || session.user.role !== "PRODUCT_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!adminUser || !adminUser.organizationId || !adminUser.applicationId) {
      return NextResponse.json({ error: "Product Admin not fully assigned to an application" }, { status: 400 });
    }

    // Fetch all Merchant Users with pending roles matrix
    const pending = await prisma.user.findMany({
      where: {
        role: "USER",
        organizationId: adminUser.organizationId,
        applicationId: adminUser.applicationId,
        roleMatrixStatus: "PENDING"
      },
      include: {
        superAdminPermissions: {
          where: { status: "PENDING_CONFIRMATION" }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    const formatted = pending.map(u => {
      let remarksObj = { userRemarks: "", reportingManager: "" };
      try {
        remarksObj = JSON.parse(u.remarks || "{}");
      } catch {
        remarksObj = { userRemarks: u.remarks || "", reportingManager: "" };
      }

      return {
        id: u.id,
        employeeId: u.employeeId,
        username: u.username,
        name: u.name,
        userApprovalStatus: u.userApprovalStatus || "DRAFT",
        roleMatrixStatus: u.roleMatrixStatus || "DRAFT",
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
        makerUsername: u.superAdminPermissions[0]?.makerUsername || u.makerUsername || "prodmaker",
        permissionsCount: u.superAdminPermissions.length,
        superAdminPermissions: u.superAdminPermissions.map(p => ({
          id: p.id,
          module: p.module,
          action: p.action,
          status: p.status
        }))
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("[MERCHANT_ROLES_CONFIRM_GET]", error);
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
    const { ids, action, remarks } = rolesConfirmSchema.parse(body);

    const dualApproval = (await prisma.configuration.findUnique({ where: { key: "MAKER_CHECKER_DUAL_APPROVAL" } }))?.value === "true";
    const rejectRemarksMandatory = (await prisma.configuration.findUnique({ where: { key: "MAKER_CHECKER_REJECT_REMARKS_MANDATORY" } }))?.value === "true";
    const returnRemarksMandatory = (await prisma.configuration.findUnique({ where: { key: "MAKER_CHECKER_RETURN_REMARKS_MANDATORY" } }))?.value === "true";
    const approveRemarksMandatory = (await prisma.configuration.findUnique({ where: { key: "MAKER_CHECKER_APPROVAL_REMARKS_MANDATORY" } }))?.value === "true";

    if (action === "REJECT" && rejectRemarksMandatory && (!remarks || !remarks.trim())) {
      return NextResponse.json({ error: "Reject action requires remarks." }, { status: 400 });
    }
    if (action === "RETURN" && returnRemarksMandatory && (!remarks || !remarks.trim())) {
      return NextResponse.json({ error: "Return action requires remarks." }, { status: 400 });
    }
    if (action === "APPROVE" && approveRemarksMandatory && (!remarks || !remarks.trim())) {
      return NextResponse.json({ error: "Approval action requires remarks." }, { status: 400 });
    }

    const checkerUsername = adminUser.username || session.user.name || "prodchecker";
    let updatedCount = 0;

    for (const id of ids) {
      const user = await prisma.user.findFirst({
        where: {
          id,
          role: "USER",
          organizationId: adminUser.organizationId,
          applicationId: adminUser.applicationId
        },
        include: { superAdminPermissions: true }
      });

      if (!user) continue;

      const pendingPerms = user.superAdminPermissions.filter(p => p.status === "PENDING_CONFIRMATION");
      const firstPending = pendingPerms[0];
      const makerUsername = firstPending?.makerUsername || user.makerUsername || "prodmaker";

      // Dual Approval policy validation
      if (dualApproval && makerUsername === checkerUsername) {
        return NextResponse.json({
          error: `Security Violation: You cannot approve/reject/return permissions because you originally submitted them for Merchant User (${user.username}).`
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
        let nextUserStatus = user.status;
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

        let remarksObj = { userRemarks: "", reportingManager: "", checkerRemarks: "" };
        try {
          remarksObj = JSON.parse(user.remarks || "{}");
        } catch {
          remarksObj = { userRemarks: user.remarks || "", reportingManager: "", checkerRemarks: "" };
        }
        remarksObj.checkerRemarks = remarks || "";
        const remarksJson = JSON.stringify(remarksObj);

        // 4. Update the user
        await tx.user.update({
          where: { id },
          data: {
            roleMatrixStatus: nextMatrixStatus,
            status: nextUserStatus,
            department: departmentVal,
            remarks: remarksJson,
            checkerUsername
          }
        });
      });

      // Write Audit Log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: `MERCHANT_ROLES_MATRIX_${action}`,
          module: "ROLES",
          status: "SUCCESS",
          details: `Checker ${action} roles matrix for Merchant User ${user.username} (${user.employeeId}). Remarks: ${remarks || "None"}. User active: ${action === "APPROVE" && user.userApprovalStatus === "APPROVED"}`
        }
      });

      updatedCount++;
    }

    return NextResponse.json({ success: true, count: updatedCount });
  } catch (error) {
    console.error("[MERCHANT_ROLES_CONFIRM_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
