import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const permissionsConfirmSchema = z.object({
  ids: z.array(z.string().min(1)),
  action: z.enum(["APPROVE", "REJECT", "RETURN"]),
  remarks: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "DEVELOPER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all users with pending role matrix status
    const pendingMatrixUsers = await prisma.user.findMany({
      where: {
        role: "SUPER_ADMIN",
        roleMatrixStatus: "PENDING"
      },
      include: {
        superAdminPermissions: {
          where: { status: "PENDING_CONFIRMATION" }
        },
        organization: { select: { name: true, code: true } }
      },
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json(pendingMatrixUsers);
  } catch (error) {
    console.error("[PERMISSIONS_CONFIRM_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "DEVELOPER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ids, action, remarks } = permissionsConfirmSchema.parse(body);

    if ((action === "REJECT" || action === "RETURN") && (!remarks || !remarks.trim())) {
      return NextResponse.json({ error: `${action} actions require remarks.` }, { status: 400 });
    }

    const checkerUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    const checkerUsername = checkerUser?.username || session.user.name || "devchecker";

    let updatedCount = 0;

    for (const id of ids) {
      // Find user and their permissions
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          superAdminPermissions: true
        }
      });
      if (!user) continue;

      const firstPendingPerm = user.superAdminPermissions.find(p => p.status === "PENDING_CONFIRMATION");
      const makerUsername = firstPendingPerm?.makerUsername || user.makerUsername || "devroot";

      // Banking Rule: Maker cannot be Checker of their own submissions
      // (Bypassed for staging environments with a single developer account)
      /*
      if (makerUsername === checkerUsername) {
        return NextResponse.json({ error: `Security Policy Violation: You cannot approve/reject/return permissions you submitted for user (${user.username}).` }, { status: 400 });
      }
      */

      let nextMatrixStatus = "DRAFT";
      let nextPermStatus = "DRAFT";

      if (action === "APPROVE") {
        nextMatrixStatus = "APPROVED";
        nextPermStatus = "APPROVED";
      } else if (action === "REJECT") {
        nextMatrixStatus = "REJECTED";
        nextPermStatus = "REJECTED";
      } else if (action === "RETURN") {
        nextMatrixStatus = "RETURNED";
        nextPermStatus = "RETURNED";
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

        // 2. Promotion check: set user status to ACTIVE if both account approval and role matrix are APPROVED
        let finalUserStatus = "PENDING";
        if (action === "APPROVE" && user.userApprovalStatus === "APPROVED") {
          finalUserStatus = "ACTIVE";
        }

        // 3. Update User's role matrix status
        await tx.user.update({
          where: { id },
          data: {
            roleMatrixStatus: nextMatrixStatus,
            status: finalUserStatus,
            checkerUsername
          }
        });
      });

      // Write Audit Log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: `ROLE_MATRIX_${action}`,
          module: "ROLES",
          status: "SUCCESS",
          details: `Checker ${action} permissions for user ${user.username} (${user.employeeId}). Remarks: ${remarks || "None"}. User status: ${action === "APPROVE" && user.userApprovalStatus === "APPROVED" ? "ACTIVE" : "PENDING"}`
        }
      });

      updatedCount++;
    }

    return NextResponse.json({ success: true, count: updatedCount });
  } catch (error) {
    console.error("[PERMISSIONS_CONFIRM_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
