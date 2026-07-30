import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const confirmSchema = z.object({
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

    const pending = await prisma.user.findMany({
      where: {
        role: "USER",
        organizationId: adminUser.organizationId,
        applicationId: adminUser.applicationId,
        userApprovalStatus: "PENDING"
      },
      orderBy: { createdAt: "desc" }
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
        email: u.email,
        mobile: u.mobile,
        department: u.department,
        designation: u.designation,
        reportingManager: remarksObj.reportingManager || "",
        remarks: remarksObj.userRemarks || "",
        status: u.status,
        userApprovalStatus: u.userApprovalStatus || "PENDING",
        makerUsername: u.makerUsername || "",
        createdAt: u.createdAt.toISOString()
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("[MERCHANT_CONFIRM_GET]", error);
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
    const { ids, action, remarks } = confirmSchema.parse(body);

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

    let approvedCount = 0;

    for (const id of ids) {
      const user = await prisma.user.findFirst({
        where: {
          id,
          role: "USER",
          organizationId: adminUser.organizationId,
          applicationId: adminUser.applicationId
        }
      });

      if (!user) continue;

      // Dual Approval policy validation
      if (dualApproval && user.makerUsername === checkerUsername) {
        return NextResponse.json({
          error: `Security Violation: You cannot approve/reject/return Merchant User ${user.username} because you originally created or modified it.`
        }, { status: 400 });
      }

      let nextApprovalStatus = "PENDING";
      let nextUserStatus = "PENDING";

      if (action === "APPROVE") {
        nextApprovalStatus = "APPROVED";
        // Activate user ONLY if Roles Matrix Confirmation is already approved as well
        if (user.roleMatrixStatus === "APPROVED") {
          nextUserStatus = "ACTIVE";
        }
      } else if (action === "REJECT") {
        nextApprovalStatus = "REJECTED";
      } else if (action === "RETURN") {
        nextApprovalStatus = "RETURNED";
      }

      let remarksObj = { userRemarks: "", reportingManager: "", checkerRemarks: "" };
      try {
        remarksObj = JSON.parse(user.remarks || "{}");
      } catch {
        remarksObj = { userRemarks: user.remarks || "", reportingManager: "", checkerRemarks: "" };
      }
      remarksObj.checkerRemarks = remarks || "";
      const remarksJson = JSON.stringify(remarksObj);

      await prisma.user.update({
        where: { id },
        data: {
          userApprovalStatus: nextApprovalStatus,
          status: nextUserStatus,
          remarks: remarksJson,
          checkerUsername
        }
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: `MERCHANT_USER_${action}`,
          module: "USERS",
          status: "SUCCESS",
          details: `Checker ${action} Merchant User ${user.username} (${user.employeeId}). Active state: ${nextUserStatus === "ACTIVE"}`
        }
      });

      approvedCount++;
    }

    return NextResponse.json({ success: true, count: approvedCount });
  } catch (error) {
    console.error("[MERCHANT_CONFIRM_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
