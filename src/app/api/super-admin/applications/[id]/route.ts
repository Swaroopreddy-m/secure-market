import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const appUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  logo: z.string().optional(),
  theme: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "DELETED"]).optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !["SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    if (!orgId) {
      return NextResponse.json({ error: "No organization associated with this account" }, { status: 400 });
    }

    const existing = await prisma.application.findFirst({
      where: {
        id,
        organizationId: orgId
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = appUpdateSchema.parse(body);

    // Parse settings
    let code = `APP-${existing.id.slice(-4).toUpperCase()}`;
    let theme = "light";
    let status = "ACTIVE";

    if (existing.settings) {
      try {
        const parsed = JSON.parse(existing.settings);
        if (parsed.code) code = parsed.code;
        if (parsed.theme) theme = parsed.theme;
        if (parsed.status) status = parsed.status;
      } catch (e) {}
    }

    const nextSettings = {
      code,
      theme: validatedData.theme !== undefined ? validatedData.theme : theme,
      status: validatedData.status !== undefined ? validatedData.status : status
    };

    const updated = await prisma.application.update({
      where: { id },
      data: {
        name: validatedData.name !== undefined ? validatedData.name : existing.name,
        description: validatedData.description !== undefined ? validatedData.description : existing.description,
        logo: validatedData.logo !== undefined ? validatedData.logo : existing.logo,
        settings: JSON.stringify(nextSettings)
      }
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: validatedData.status !== undefined ? `APPLICATION_STATUS_${validatedData.status}` : "APPLICATION_UPDATED",
        module: "APPLICATIONS",
        status: "SUCCESS",
        details: `Super Admin modified application ${updated.name} (${code})`
      }
    });

    return NextResponse.json({ success: true, app: updated });
  } catch (error) {
    console.error("[APPLICATIONS_PATCH]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !["SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    if (!orgId) {
      return NextResponse.json({ error: "No organization associated with this account" }, { status: 400 });
    }

    const existing = await prisma.application.findFirst({
      where: {
        id,
        organizationId: orgId
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Soft delete: update settings JSON to status DELETED
    let code = `APP-${existing.id.slice(-4).toUpperCase()}`;
    let theme = "light";

    if (existing.settings) {
      try {
        const parsed = JSON.parse(existing.settings);
        if (parsed.code) code = parsed.code;
        if (parsed.theme) theme = parsed.theme;
      } catch (e) {}
    }

    const deletedSettings = {
      code,
      theme,
      status: "DELETED"
    };

    await prisma.application.update({
      where: { id },
      data: {
        settings: JSON.stringify(deletedSettings)
      }
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "APPLICATION_SOFT_DELETED",
        module: "APPLICATIONS",
        status: "SUCCESS",
        details: `Super Admin soft deleted application ${existing.name} (${code})`
      }
    });

    return NextResponse.json({ success: true, message: "Application soft deleted successfully" });
  } catch (error) {
    console.error("[APPLICATIONS_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
