import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const merchantUserUpdateSchema = z.object({
  firstName: z.string().min(1, "First Name is required").optional(),
  lastName: z.string().min(1, "Last Name is required").optional(),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  password: z.string().min(6).optional().or(z.literal("")),
  email: z.string().email("Valid email is required").optional(),
  mobile: z.string().min(5, "Valid mobile number is required").optional(),
  department: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  reportingManager: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  submitStatus: z.enum(["DRAFT", "PENDING"]).default("PENDING")
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const existing = await prisma.user.findFirst({
      where: {
        id,
        role: "USER",
        organizationId: adminUser.organizationId,
        applicationId: adminUser.applicationId
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Merchant User not found or outside organization/application" }, { status: 404 });
    }

    // Business Rule: Approved users cannot be edited directly
    if (existing.userApprovalStatus === "APPROVED") {
      return NextResponse.json({ error: "Approved user records cannot be modified directly." }, { status: 400 });
    }

    const body = await request.json();
    const validated = merchantUserUpdateSchema.parse(body);

    // Unique checks
    if (validated.username && validated.username !== existing.username) {
      const dupe = await prisma.user.findUnique({ where: { username: validated.username } });
      if (dupe) return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    if (validated.email && validated.email !== existing.email) {
      const dupe = await prisma.user.findUnique({ where: { email: validated.email } });
      if (dupe) return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    const passHash = validated.password ? hashPassword(validated.password) : undefined;
    const checkerEnabled = (await prisma.configuration.findUnique({ where: { key: "MAKER_CHECKER_CHECKER_ENABLED" } }))?.value === "true";

    const userApprovalStatus = checkerEnabled
      ? (validated.submitStatus === "PENDING" ? "PENDING" : "DRAFT")
      : "APPROVED";

    let remarksObj = { userRemarks: "", reportingManager: "" };
    try {
      remarksObj = JSON.parse(existing.remarks || "{}");
    } catch {
      remarksObj = { userRemarks: existing.remarks || "", reportingManager: "" };
    }

    if (validated.remarks !== undefined) remarksObj.userRemarks = validated.remarks || "";
    if (validated.reportingManager !== undefined) remarksObj.reportingManager = validated.reportingManager || "";

    const remarksJson = JSON.stringify(remarksObj);
    const makerUsername = adminUser.username || session.user.name || "prodmaker";

    const firstNameVal = validated.firstName !== undefined ? validated.firstName : existing.firstName;
    const lastNameVal = validated.lastName !== undefined ? validated.lastName : existing.lastName;
    const fullName = `${firstNameVal || ""} ${lastNameVal || ""}`.trim() || existing.name;

    // Promotion check: if Checker is disabled, auto-approve could make the user ACTIVE if role matrix is also APPROVED
    let nextUserStatus = "PENDING";
    if (userApprovalStatus === "APPROVED" && existing.roleMatrixStatus === "APPROVED") {
      nextUserStatus = "ACTIVE";
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        username: validated.username,
        name: fullName,
        email: validated.email,
        passwordHash: passHash,
        department: validated.department !== undefined ? (validated.department || "") : undefined,
        designation: validated.designation !== undefined ? (validated.designation || "") : undefined,
        firstName: validated.firstName,
        lastName: validated.lastName,
        mobile: validated.mobile,
        remarks: remarksJson,
        userApprovalStatus,
        status: nextUserStatus,
        makerUsername
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: userApprovalStatus === "APPROVED" ? "MERCHANT_USER_AUTO_APPROVED_ON_EDIT" : "MERCHANT_USER_MODIFIED",
        module: "USERS",
        status: "SUCCESS",
        details: `Maker modified Merchant User ${updated.username} (${updated.employeeId}). Status: ${userApprovalStatus}`
      }
    });

    return NextResponse.json({ success: true, id: updated.id, username: updated.username });
  } catch (error) {
    console.error("[MERCHANT_USER_PATCH]", error);
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

    if (!session || session.user.role !== "PRODUCT_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!adminUser || !adminUser.organizationId || !adminUser.applicationId) {
      return NextResponse.json({ error: "Product Admin not fully assigned to an application" }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: {
        id,
        role: "USER",
        organizationId: adminUser.organizationId,
        applicationId: adminUser.applicationId
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Merchant User not found or outside organization/application" }, { status: 404 });
    }

    // Delete user from db
    await prisma.$transaction([
      prisma.superAdminPermission.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } })
    ]);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "MERCHANT_USER_DELETED",
        module: "USERS",
        status: "SUCCESS",
        details: `Maker deleted Merchant User ${existing.username} (${existing.employeeId})`
      }
    });

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("[MERCHANT_USER_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
