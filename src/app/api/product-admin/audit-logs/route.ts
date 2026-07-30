import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

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

    const logs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          {
            user: {
              organizationId: adminUser.organizationId,
              applicationId: adminUser.applicationId
            }
          }
        ]
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            username: true,
            role: true
          }
        }
      },
      orderBy: { timestamp: "desc" },
      take: 250
    });

    const formatted = logs.map(log => ({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      action: log.action,
      module: log.module,
      status: log.status,
      ip: log.ip || "127.0.0.1",
      browser: log.browser || "Chrome",
      device: log.device || "Desktop",
      details: log.details || "",
      user: log.user ? {
        name: log.user.name || log.user.username || "Unknown User",
        email: log.user.email || "",
        username: log.user.username || "",
        role: log.user.role
      } : null
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("[AUDIT_LOGS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
