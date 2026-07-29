import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const applicationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  logo: z.string().default("/images/apps/default.png"),
  description: z.string().optional(),
  settings: z.string().optional()
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["DEVELOPER", "SUPER_ADMIN", "PRODUCT_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let whereClause = {};
    if (session.user.role !== "DEVELOPER") {
      if (!session.user.organizationId) {
        return NextResponse.json([]);
      }
      whereClause = { organizationId: session.user.organizationId };
    }

    const apps = await prisma.application.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(apps);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to fetch applications" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["DEVELOPER", "SUPER_ADMIN", "PRODUCT_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = applicationSchema.parse(body);

    const orgId = session.user.role === "DEVELOPER" ? (body.organizationId || null) : session.user.organizationId;

    const newApp = await prisma.application.create({
      data: {
        name: validatedData.name,
        logo: validatedData.logo || "/images/apps/default.png",
        description: validatedData.description || null,
        settings: validatedData.settings || null,
        organizationId: orgId
      }
    });

    // Create system audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_APP",
        module: "APPLICATION",
        status: "SUCCESS",
        details: `Created marketplace application: ${newApp.name} (${newApp.id})`
      }
    });

    return NextResponse.json(newApp);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to create application" }, { status: 500 });
  }
}
