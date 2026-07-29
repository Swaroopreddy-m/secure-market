import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const applicationUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  logo: z.string().optional(),
  description: z.string().optional(),
  settings: z.string().optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !["DEVELOPER", "SUPER_ADMIN", "PRODUCT_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = applicationUpdateSchema.parse(body);

    const existing = await prisma.application.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (session.user.role !== "DEVELOPER" && existing.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        name: validatedData.name !== undefined ? validatedData.name : existing.name,
        logo: validatedData.logo !== undefined ? validatedData.logo : existing.logo,
        description: validatedData.description !== undefined ? validatedData.description : existing.description,
        settings: validatedData.settings !== undefined ? validatedData.settings : existing.settings
      }
    });

    // Create system audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_APP",
        module: "APPLICATION",
        status: "SUCCESS",
        details: `Updated marketplace application: ${updated.name} (${updated.id})`
      }
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to update application" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !["DEVELOPER", "SUPER_ADMIN", "PRODUCT_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.application.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (session.user.role !== "DEVELOPER" && existing.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.application.delete({
      where: { id }
    });

    // Create system audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE_APP",
        module: "APPLICATION",
        status: "SUCCESS",
        details: `Deleted marketplace application: ${existing.name} (${existing.id})`
      }
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to delete application" }, { status: 500 });
  }
}
