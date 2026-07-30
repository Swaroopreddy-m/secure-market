import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const appSchema = z.object({
  name: z.string().min(1, "Application name is required"),
  description: z.string().optional().nullable(),
  logo: z.string().optional(),
  theme: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional()
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["SUPER_ADMIN", "DEVELOPER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    if (!orgId) {
      return NextResponse.json({ error: "No organization associated with this account" }, { status: 400 });
    }

    const apps = await prisma.application.findMany({
      where: {
        organizationId: orgId
      },
      orderBy: { createdAt: "desc" }
    });

    // Unpack settings
    const formattedApps = apps.map(app => {
      let code = `APP-${app.id.slice(-4).toUpperCase()}`;
      let theme = "light";
      let status = "ACTIVE";

      if (app.settings) {
        try {
          const parsed = JSON.parse(app.settings);
          if (parsed.code) code = parsed.code;
          if (parsed.theme) theme = parsed.theme;
          if (parsed.status) status = parsed.status;
        } catch (e) {}
      }

      return {
        id: app.id,
        name: app.name,
        description: app.description || "",
        logo: app.logo,
        createdAt: app.createdAt.toISOString(),
        code,
        theme,
        status
      };
    }).filter(app => app.status !== "DELETED"); // Filter out soft-deleted ones

    return NextResponse.json(formattedApps);
  } catch (error) {
    console.error("[APPLICATIONS_GET]", error);
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
    const validatedData = appSchema.parse(body);

    // Auto-generate code
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const code = `APP-${randNum}`;

    const settingsObj = {
      code,
      theme: validatedData.theme || "light",
      status: validatedData.status || "ACTIVE"
    };

    const newApp = await prisma.application.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || "",
        logo: validatedData.logo || "/images/apps/default.png",
        settings: JSON.stringify(settingsObj),
        organizationId: orgId
      }
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "APPLICATION_CREATED",
        module: "APPLICATIONS",
        status: "SUCCESS",
        details: `Super Admin created application ${validatedData.name} (${code})`
      }
    });

    return NextResponse.json({ success: true, app: newApp });
  } catch (error) {
    console.error("[APPLICATIONS_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
