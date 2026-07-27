import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Only DEVELOPER can modify RBAC matrix configs
    if (!session || session.user.role !== "DEVELOPER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mappings } = await request.json();

    if (!Array.isArray(mappings)) {
      return NextResponse.json({ error: "Invalid mappings list" }, { status: 400 });
    }

    const developerRole = await prisma.role.findUnique({
      where: { name: "DEVELOPER" }
    });

    // Delete existing mappings for non-developer roles
    await prisma.rolePermission.deleteMany({
      where: {
        roleId: { not: developerRole?.id }
      }
    });

    // Filter out any incoming Developer mappings to protect developer role permissions
    const nonDevMappings = mappings.filter(m => m.roleId !== developerRole?.id);

    // Create new mappings
    const result = await prisma.rolePermission.createMany({
      data: nonDevMappings.map((m: { roleId: string; permissionId: string }) => ({
        roleId: m.roleId,
        permissionId: m.permissionId
      }))
    });

    // Log the audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_PERMISSIONS",
        module: "ROLES",
        status: "SUCCESS",
        details: `Saved RBAC matrix configuration: created ${result.count} mappings`
      }
    });

    return NextResponse.json({ message: "Permissions matrix updated successfully", count: result.count });
  } catch (error) {
    console.error("[PERMISSIONS_SAVE_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
