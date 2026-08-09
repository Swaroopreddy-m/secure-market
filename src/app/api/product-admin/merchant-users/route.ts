import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const merchantUserSchema = z.object({
  firstName: z.string().min(1, "First Name is required"),
  lastName: z.string().min(1, "Last Name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Valid email is required"),
  mobile: z.string().min(5, "Valid mobile number is required"),
  department: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  reportingManager: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  submitStatus: z.enum(["DRAFT", "PENDING"]).default("PENDING")
});

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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const statusFilter = searchParams.get("status") || ""; // DRAFT, PENDING, APPROVED, REJECTED, RETURNED
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Query builder
    const whereClause: any = {
      role: "USER",
      organizationId: adminUser.organizationId,
      applicationId: adminUser.applicationId,
    };

    if (statusFilter) {
      whereClause.userApprovalStatus = statusFilter;
    }

    if (search) {
      whereClause.OR = [
        { username: { contains: search } },
        { name: { contains: search } },
        { email: { contains: search } },
        { employeeId: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: {
        [sortBy]: sortOrder
      }
    });

    const formatted = users.map(u => {
      let remarksObj = { userRemarks: "", reportingManager: "" };
      try {
        remarksObj = JSON.parse(u.remarks || "{}");
      } catch {
        remarksObj = { userRemarks: u.remarks || "", reportingManager: "" };
      }

      return {
        id: u.id,
        employeeId: u.employeeId,
        username: u.username,
        name: u.name,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        mobile: u.mobile,
        department: u.department,
        designation: u.designation,
        reportingManager: remarksObj.reportingManager || "",
        remarks: remarksObj.userRemarks || "",
        status: u.status,
        userApprovalStatus: u.userApprovalStatus || "DRAFT",
        roleMatrixStatus: u.roleMatrixStatus || "DRAFT",
        makerUsername: u.makerUsername || "",
        checkerUsername: u.checkerUsername || "",
        createdAt: u.createdAt.toISOString()
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("[MERCHANT_USERS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const validated = merchantUserSchema.parse(body);

    // Verify uniqueness
    const dupeUser = await prisma.user.findUnique({
      where: { username: validated.username }
    });
    if (dupeUser) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    const dupeEmail = await prisma.user.findUnique({
      where: { email: validated.email }
    });
    if (dupeEmail) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    // Load configurations
    const checkerEnabled = (await prisma.configuration.findUnique({ where: { key: "MAKER_CHECKER_CHECKER_ENABLED" } }))?.value === "true";

    // Auto-generate employee ID scoped to this org and application
    const count = await prisma.user.count({
      where: {
        role: "USER",
        organizationId: adminUser.organizationId,
        applicationId: adminUser.applicationId
      }
    });
    const employeeId = `MU-${(count + 1).toString().padStart(4, "0")}`;

    const hashed = hashPassword(validated.password);
    const fullName = `${validated.firstName} ${validated.lastName}`.trim();
    const makerUsername = adminUser.username || session.user.name || "prodmaker";

    // Package remarks and reportingManager as a JSON string to avoid schema changes
    const remarksJson = JSON.stringify({
      userRemarks: validated.remarks || "",
      reportingManager: validated.reportingManager || ""
    });

    // If Checker is disabled, it is directly approved.
    const userApprovalStatus = checkerEnabled
      ? (validated.submitStatus === "PENDING" ? "PENDING" : "DRAFT")
      : "APPROVED";
    const roleMatrixStatus = checkerEnabled ? "DRAFT" : "APPROVED";
    const finalStatus = checkerEnabled ? "PENDING" : "ACTIVE";

    const roleRecord = await prisma.role.findUnique({
      where: { name: "USER" }
    });

    const user = await prisma.user.create({
      data: {
        employeeId,
        username: validated.username,
        name: fullName,
        email: validated.email,
        passwordHash: hashed,
        role: "USER",
        roleId: roleRecord?.id || null,
        department: validated.department || "",
        designation: validated.designation || "",
        status: finalStatus,
        organizationId: adminUser.organizationId,
        applicationId: adminUser.applicationId,
        firstName: validated.firstName,
        lastName: validated.lastName,
        mobile: validated.mobile,
        remarks: remarksJson,
        makerUsername,
        userApprovalStatus,
        roleMatrixStatus
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: userApprovalStatus === "APPROVED" ? "MERCHANT_USER_AUTO_APPROVED" : (validated.submitStatus === "PENDING" ? "MERCHANT_USER_SUBMITTED" : "MERCHANT_USER_DRAFT"),
        module: "USERS",
        status: "SUCCESS",
        details: `Maker created Merchant User ${user.username} (${employeeId}). Status: ${userApprovalStatus}`
      }
    });

    return NextResponse.json({ success: true, id: user.id, username: user.username, employeeId });
  } catch (error) {
    console.error("[MERCHANT_USERS_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
