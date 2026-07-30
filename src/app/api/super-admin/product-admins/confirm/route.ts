import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const productAdminConfirmSchema = z.object({
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

    // Get all pending Product Admins
    const pending = await prisma.user.findMany({
      where: {
        role: "PRODUCT_ADMIN",
        organizationId: orgId,
        userApprovalStatus: "PENDING"
      },
      include: {
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
      status: u.status,
      remarks: u.remarks || "",
      userApprovalStatus: u.userApprovalStatus || "DRAFT",
      makerUsername: u.makerUsername || "supermaker",
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
      applicationName: u.application?.name || "Unassigned"
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("[PRODUCT_ADMINS_CONFIRM_GET]", error);
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
    const { ids, action, remarks } = productAdminConfirmSchema.parse(body);

    if ((action === "REJECT" || action === "RETURN") && (!remarks || !remarks.trim())) {
      return NextResponse.json({ error: `${action} actions require remarks.` }, { status: 400 });
    }

    const checkerUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    const checkerUsername = checkerUser?.username || session.user.name || "superchecker";

    let updatedCount = 0;

    for (const id of ids) {
      const targetUser = await prisma.user.findFirst({
        where: { id, organizationId: orgId }
      });

      if (!targetUser) continue;

      // Enterprise Policy: Maker cannot be Checker of their own submissions
      if (targetUser.makerUsername === checkerUsername) {
        return NextResponse.json({ 
          error: `Security Policy Violation: You cannot approve/reject/return user (${targetUser.username}) because you originally created/submitted this record.` 
        }, { status: 400 });
      }

      let nextApprovalStatus = "DRAFT";
      if (action === "APPROVE") {
        nextApprovalStatus = "APPROVED";
      } else if (action === "REJECT") {
        nextApprovalStatus = "REJECTED";
      } else if (action === "RETURN") {
        nextApprovalStatus = "RETURNED";
      }

      // Promotion Check
      let nextStatus = "PENDING";
      // Product Admin cannot become active until User Approval is completed AND Roles & Matrix Approval is completed.
      if (action === "APPROVE" && targetUser.roleMatrixStatus === "APPROVED") {
        nextStatus = "ACTIVE";
      }

      await prisma.user.update({
        where: { id },
        data: {
          userApprovalStatus: nextApprovalStatus,
          remarks: remarks || targetUser.remarks || "",
          status: nextStatus,
          checkerUsername
        }
      });

      // Write Audit Log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: `PRODUCT_ADMIN_${action}`,
          module: "USERS",
          status: "SUCCESS",
          details: `Checker ${action} Product Admin ${targetUser.username} (${targetUser.employeeId}). Remarks: ${remarks || "None"}. User active: ${nextStatus === "ACTIVE"}`
        }
      });

      updatedCount++;
    }

    return NextResponse.json({ success: true, count: updatedCount });
  } catch (error) {
    console.error("[PRODUCT_ADMINS_CONFIRM_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
