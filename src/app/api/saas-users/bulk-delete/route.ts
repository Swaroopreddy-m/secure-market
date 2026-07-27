import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["DEVELOPER", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Invalid user list IDs" }, { status: 400 });
    }

    // Exclude current user from delete list
    const filteredIds = ids.filter(id => id !== session.user.id);

    if (filteredIds.length === 0) {
      return NextResponse.json({ error: "Cannot delete your own active account" }, { status: 400 });
    }

    const result = await prisma.user.deleteMany({
      where: {
        id: { in: filteredIds }
      }
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "BULK_DELETE",
        module: "USERS",
        status: "SUCCESS",
        details: `Bulk deleted ${result.count} users`
      }
    });

    return NextResponse.json({ message: `Successfully deleted ${result.count} users` });
  } catch (error) {
    console.error("[BULK_DELETE_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
