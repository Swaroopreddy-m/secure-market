import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const userCreateSchema = z.object({
  employeeId: z.string().optional().nullable(),
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.string().default("USER"),
  department: z.string().optional().nullable(),
  status: z.string().default("PENDING"),
  
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  organizationId: z.string().optional().nullable(),
  userApprovalStatus: z.string().default("DRAFT"), // DRAFT, PENDING
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["DEVELOPER", "SUPER_ADMIN", "PRODUCT_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = userCreateSchema.parse(body);

    // Enforce creation hierarchy
    const creatorRole = session.user.role;
    const targetRole = validatedData.role;

    if (creatorRole === "DEVELOPER" && targetRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Developer can only create Super Admin users." }, { status: 403 });
    }
    if (creatorRole === "SUPER_ADMIN" && !["PRODUCT_ADMIN", "USER"].includes(targetRole)) {
      return NextResponse.json({ error: "Super Admin can only create Product Admin or Market User accounts." }, { status: 403 });
    }
    if (creatorRole === "PRODUCT_ADMIN" && targetRole !== "USER") {
      return NextResponse.json({ error: "Product Admin can only create User (Shop) accounts." }, { status: 403 });
    }

    // Verify username and email uniqueness
    const existingUsername = await prisma.user.findUnique({
      where: { username: validatedData.username }
    });
    if (existingUsername) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });
    if (existingEmail) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    // Auto-generate employee ID sequentially if not provided
    let empId = validatedData.employeeId?.trim();
    if (!empId) {
      const count = await prisma.user.count();
      empId = `EMP-${(count + 1).toString().padStart(4, "0")}`;
    }

    const existingEmp = await prisma.user.findUnique({
      where: { employeeId: empId }
    });
    if (existingEmp) {
      return NextResponse.json({ error: "Employee ID already exists" }, { status: 400 });
    }

    const hashed = hashPassword(validatedData.password);

    // Find roleId
    const roleRecord = await prisma.role.findUnique({
      where: { name: validatedData.role }
    });

    // Query creator user details for maker audit tracking
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    const makerUsername = currentUser?.username || session.user.name || "devroot";

    const name = `${validatedData.firstName || ""} ${validatedData.lastName || ""}`.trim() || validatedData.username;

    // Create user. If Developer is the creator, the user approval status is set from request (DRAFT or PENDING).
    // The user's status begins as "PENDING" (or "INACTIVE"), not immediately "ACTIVE" until approved by the Checker.
    const user = await prisma.user.create({
      data: {
        employeeId: empId,
        username: validatedData.username,
        name: name,
        email: validatedData.email,
        passwordHash: hashed,
        role: validatedData.role,
        roleId: roleRecord?.id || null,
        department: validatedData.department || null,
        status: "PENDING", // Starts inactive pending Maker-Checker approvals
        organizationId: session.user.role === "DEVELOPER" ? (validatedData.organizationId || null) : session.user.organizationId,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        mobile: validatedData.mobile,
        designation: validatedData.designation,
        remarks: validatedData.remarks,
        makerUsername: makerUsername,
        userApprovalStatus: validatedData.userApprovalStatus, // DRAFT or PENDING
        roleMatrixStatus: "DRAFT", // Matrix starts as draft until explicitly modified in Roles & Matrix
      }
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: validatedData.userApprovalStatus === "PENDING" ? "USER_SUBMITTED" : "USER_CREATED_DRAFT",
        module: "USERS",
        status: "SUCCESS",
        details: `Maker created user ${user.username} (${user.employeeId}) with approval status ${user.userApprovalStatus}`
      }
    });

    return NextResponse.json({ id: user.id, username: user.username });
  } catch (error) {
    console.error("[SAAS_USER_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
