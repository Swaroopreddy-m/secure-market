import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const checkerActionSchema = z.object({
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

    const pendingUsers = await prisma.user.findMany({
      where: {
        role: "SUPER_ADMIN",
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(pendingUsers);
  } catch (error) {
    console.error("[CONFIRM_USERS_GET]", error);
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
    const { ids, action, remarks } = checkerActionSchema.parse(body);

    if ((action === "REJECT" || action === "RETURN") && (!remarks || !remarks.trim())) {
      return NextResponse.json({ error: `${action} actions require remarks.` }, { status: 400 });
    }

    const checkerUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    const checkerUsername = checkerUser?.username || session.user.name || "devchecker";

    // Process each user update
    let updatedCount = 0;
    
    for (const id of ids) {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) continue;

      // Banking Rule: Maker cannot be Checker of their own submissions
      if (user.makerUsername === checkerUsername) {
        return NextResponse.json({ error: `Security Policy Violation: You cannot approve/reject/return your own created user account (${user.username}).` }, { status: 400 });
      }

      let nextUserStatus = "PENDING";
      let nextApprovalStatus = "PENDING";

      if (action === "APPROVE") {
        nextApprovalStatus = "APPROVED";
        // Promotion Rule: Promotion to ACTIVE is only completed if both account AND role matrix are approved
        if (user.roleMatrixStatus === "APPROVED") {
          nextUserStatus = "ACTIVE";
        }
      } else if (action === "REJECT") {
        nextApprovalStatus = "REJECTED";
      } else if (action === "RETURN") {
        nextApprovalStatus = "RETURNED";
      }

      await prisma.user.update({
        where: { id },
        data: {
          userApprovalStatus: nextApprovalStatus,
          status: nextUserStatus,
          remarks: remarks || user.remarks,
          checkerUsername: checkerUsername,
        }
      });

      // Write Audit Log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: `USER_${action}`,
          module: "USERS",
          status: "SUCCESS",
          details: `Checker ${action} user ${user.username} (${user.employeeId}). Remarks: ${remarks || "None"}. Promotion status: ${nextUserStatus}`
        }
      });

      updatedCount++;
    }

    return NextResponse.json({ success: true, count: updatedCount });
  } catch (error) {
    console.error("[CONFIRM_USERS_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
