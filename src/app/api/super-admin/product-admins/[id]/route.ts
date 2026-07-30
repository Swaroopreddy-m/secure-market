import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const productAdminUpdateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional().or(z.literal("")),
  email: z.string().optional(),
  mobile: z.string().optional(),
  department: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  applicationId: z.string().optional(),
  remarks: z.string().optional().nullable(),
  userApprovalStatus: z.enum(["DRAFT", "PENDING"]).optional()
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

    const existing = await prisma.user.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Product Admin not found" }, { status: 404 });
    }

    if (existing.organizationId !== orgId) {
      return NextResponse.json({ error: "Unauthorized access to another organization's user" }, { status: 403 });
    }

    // Business Rule: Approved records cannot be edited
    if (existing.userApprovalStatus === "APPROVED") {
      return NextResponse.json({ error: "Approved records cannot be modified." }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = productAdminUpdateSchema.parse(body);

    // Unique checks
    if (validatedData.username && validatedData.username !== existing.username) {
      const duplicateUser = await prisma.user.findUnique({
        where: { username: validatedData.username }
      });
      if (duplicateUser) {
        return NextResponse.json({ error: "Username already exists" }, { status: 400 });
      }
    }

    if (validatedData.email && validatedData.email !== existing.email) {
      const duplicateEmail = await prisma.user.findUnique({
        where: { email: validatedData.email }
      });
      if (duplicateEmail) {
        return NextResponse.json({ error: "Email already exists" }, { status: 400 });
      }
    }

    const hashed = validatedData.password ? hashPassword(validatedData.password) : undefined;
    
    const firstName = validatedData.firstName !== undefined ? validatedData.firstName : existing.firstName;
    const lastName = validatedData.lastName !== undefined ? validatedData.lastName : existing.lastName;
    const name = `${firstName || ""} ${lastName || ""}`.trim() || existing.name;

    const creatorUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    const makerUsername = creatorUser?.username || session.user.name || "supermaker";

    const updated = await prisma.user.update({
      where: { id },
      data: {
        username: validatedData.username !== undefined ? validatedData.username : existing.username,
        name,
        email: validatedData.email !== undefined ? validatedData.email : existing.email,
        passwordHash: hashed !== undefined ? hashed : existing.passwordHash,
        department: validatedData.department !== undefined ? validatedData.department : existing.department,
        applicationId: validatedData.applicationId !== undefined ? validatedData.applicationId : existing.applicationId,
        firstName: validatedData.firstName !== undefined ? validatedData.firstName : existing.firstName,
        lastName: validatedData.lastName !== undefined ? validatedData.lastName : existing.lastName,
        mobile: validatedData.mobile !== undefined ? validatedData.mobile : existing.mobile,
        designation: validatedData.designation !== undefined ? validatedData.designation : existing.designation,
        remarks: validatedData.remarks !== undefined ? validatedData.remarks : existing.remarks,
        userApprovalStatus: validatedData.userApprovalStatus !== undefined ? validatedData.userApprovalStatus : existing.userApprovalStatus,
        makerUsername
      }
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: validatedData.userApprovalStatus === "PENDING" ? "PRODUCT_ADMIN_RESUBMITTED" : "PRODUCT_ADMIN_MODIFIED",
        module: "USERS",
        status: "SUCCESS",
        details: `Super Admin modified Product Admin ${updated.username} (${updated.employeeId}). Status: ${updated.userApprovalStatus}`
      }
    });

    return NextResponse.json({ success: true, user: { id: updated.id, username: updated.username } });
  } catch (error) {
    console.error("[PRODUCT_ADMINS_PATCH]", error);
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

    const existing = await prisma.user.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Product Admin not found" }, { status: 404 });
    }

    if (existing.organizationId !== orgId) {
      return NextResponse.json({ error: "Unauthorized access to another organization's user" }, { status: 403 });
    }

    // Business Rule: Approved records cannot be edited or deleted directly from Maker table (must remain in Audit History)
    if (existing.userApprovalStatus === "APPROVED") {
      return NextResponse.json({ error: "Approved Product Admin accounts cannot be deleted directly." }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id }
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "PRODUCT_ADMIN_DELETED",
        module: "USERS",
        status: "SUCCESS",
        details: `Super Admin deleted draft/pending Product Admin ${existing.username} (${existing.employeeId})`
      }
    });

    return NextResponse.json({ success: true, message: "Product Admin deleted successfully" });
  } catch (error) {
    console.error("[PRODUCT_ADMINS_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
