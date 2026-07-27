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

    const { ids, role } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0 || !role) {
      return NextResponse.json({ error: "Invalid user list or role name" }, { status: 400 });
    }

    // Resolve role ID
    const roleRecord = await prisma.role.findUnique({
      where: { name: role }
    });

    if (!roleRecord) {
      return NextResponse.json({ error: "Specified role does not exist" }, { status: 400 });
    }

    const result = await prisma.user.updateMany({
      where: {
        id: { in: ids }
      },
      data: {
        role: role,
        roleId: roleRecord.id
      }
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "BULK_ASSIGN_ROLE",
        module: "USERS",
        status: "SUCCESS",
        details: `Bulk assigned role ${role} to ${result.count} users`
      }
    });

    return NextResponse.json({ message: `Successfully updated ${result.count} users to role ${role}` });
  } catch (error) {
    console.error("[BULK_ROLE_ASSIGN_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
