import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const matrixSaveSchema = z.object({
  userId: z.string().min(1),
  permissions: z.array(z.object({
    module: z.string().min(1),
    action: z.string().min(1),
  })),
  submitStatus: z.enum(["DRAFT", "PENDING"]), // DRAFT = Save, PENDING = Submit
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "DEVELOPER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const permissions = await prisma.superAdminPermission.findMany({
      where: { userId }
    });

    return NextResponse.json(permissions);
  } catch (error) {
    console.error("[MATRIX_GET]", error);
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
    const { userId, permissions, submitStatus } = matrixSaveSchema.parse(body);

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    const makerUsername = currentUser?.username || session.user.name || "devroot";

    const permissionStatus = submitStatus === "PENDING" ? "PENDING_CONFIRMATION" : "DRAFT";

    // Recreate mappings in transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete all existing permissions for this user
      await tx.superAdminPermission.deleteMany({
        where: { userId }
      });

      // 2. Re-create new permissions in requested status
      if (permissions.length > 0) {
        await tx.superAdminPermission.createMany({
          data: permissions.map(p => ({
            userId,
            module: p.module,
            action: p.action,
            status: permissionStatus,
            makerUsername,
          }))
        });
      }

      // 3. Update User's role matrix status
      await tx.user.update({
        where: { id: userId },
        data: {
          roleMatrixStatus: submitStatus, // DRAFT or PENDING
        }
      });
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: submitStatus === "PENDING" ? "ROLE_MATRIX_SUBMITTED" : "ROLE_MATRIX_SAVED",
        module: "ROLES",
        status: "SUCCESS",
        details: `Maker saved role matrix for user ${targetUser.username}. Status: ${submitStatus}. Total permissions: ${permissions.length}`
      }
    });

    return NextResponse.json({ success: true, count: permissions.length });
  } catch (error) {
    console.error("[MATRIX_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
