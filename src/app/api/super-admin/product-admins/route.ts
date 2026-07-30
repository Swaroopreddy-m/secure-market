import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const productAdminCreateSchema = z.object({
  firstName: z.string().min(1, "First Name is required"),
  lastName: z.string().min(1, "Last Name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Valid email is required"),
  mobile: z.string().min(5, "Valid mobile number is required"),
  department: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  applicationId: z.string().min(1, "Application is required"),
  remarks: z.string().optional().nullable(),
  userApprovalStatus: z.enum(["DRAFT", "PENDING"]).default("PENDING")
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    if (!orgId) {
      return NextResponse.json({ error: "No organization associated with this account" }, { status: 400 });
    }

    const users = await prisma.user.findMany({
      where: {
        role: "PRODUCT_ADMIN",
        organizationId: orgId
      },
      include: {
        application: {
          select: { name: true, id: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const formatted = users.map((u) => ({
      id: u.id,
      employeeId: u.employeeId,
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      name: u.name || "",
      username: u.username || "",
      email: u.email || "",
      mobile: u.mobile || "",
      department: u.department || "",
      designation: u.designation || "",
      status: u.status,
      remarks: u.remarks || "",
      userApprovalStatus: u.userApprovalStatus || "DRAFT",
      roleMatrixStatus: u.roleMatrixStatus || "DRAFT",
      makerUsername: u.makerUsername || "",
      checkerUsername: u.checkerUsername || "",
      createdAt: u.createdAt.toISOString(),
      applicationId: u.applicationId || "",
      applicationName: u.application?.name || "Unassigned"
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("[PRODUCT_ADMINS_GET]", error);
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
    const validatedData = productAdminCreateSchema.parse(body);

    // Verify unique username/email
    const duplicateUser = await prisma.user.findUnique({
      where: { username: validatedData.username }
    });
    if (duplicateUser) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    const duplicateEmail = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });
    if (duplicateEmail) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    // Auto-generate employeeId sequentially
    const count = await prisma.user.count({
      where: {
        role: "PRODUCT_ADMIN",
        organizationId: orgId
      }
    });
    const employeeId = `PAD-${(count + 1).toString().padStart(4, "0")}`;

    const hashed = hashPassword(validatedData.password);
    const name = `${validatedData.firstName} ${validatedData.lastName}`.trim();

    const roleRecord = await prisma.role.findUnique({
      where: { name: "PRODUCT_ADMIN" }
    });

    const creatorUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    const makerUsername = creatorUser?.username || session.user.name || "supermaker";

    const user = await prisma.user.create({
      data: {
        employeeId,
        username: validatedData.username,
        name,
        email: validatedData.email,
        passwordHash: hashed,
        role: "PRODUCT_ADMIN",
        roleId: roleRecord?.id || null,
        department: validatedData.department || "",
        status: "PENDING", // Starts inactive
        organizationId: orgId,
        applicationId: validatedData.applicationId,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        mobile: validatedData.mobile,
        designation: validatedData.designation,
        remarks: validatedData.remarks || "",
        makerUsername,
        userApprovalStatus: validatedData.userApprovalStatus, // DRAFT or PENDING
        roleMatrixStatus: "DRAFT" // Roles status starts as Draft
      }
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: validatedData.userApprovalStatus === "PENDING" ? "PRODUCT_ADMIN_SUBMITTED" : "PRODUCT_ADMIN_DRAFT",
        module: "USERS",
        status: "SUCCESS",
        details: `Super Admin created Product Admin ${user.username} (${employeeId}). Status: ${user.userApprovalStatus}`
      }
    });

    return NextResponse.json({ success: true, user: { id: user.id, username: user.username, employeeId } });
  } catch (error) {
    console.error("[PRODUCT_ADMINS_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
