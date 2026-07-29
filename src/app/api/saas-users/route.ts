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
  employeeId: z.string().min(1, "Employee ID is required"),
  username: z.string().min(1, "Username is required"),
  name: z.string().min(1, "Full Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.string().default("USER"),
  department: z.string().optional(),
  status: z.string().default("ACTIVE"),
  productIds: z.array(z.string()).default([]),
  customerIds: z.array(z.string()).default([])
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

    const existingEmp = await prisma.user.findUnique({
      where: { employeeId: validatedData.employeeId }
    });
    if (existingEmp) {
      return NextResponse.json({ error: "Employee ID already exists" }, { status: 400 });
    }

    const hashed = hashPassword(validatedData.password);

    // Find roleId
    const roleRecord = await prisma.role.findUnique({
      where: { name: validatedData.role }
    });

    const user = await prisma.user.create({
      data: {
        employeeId: validatedData.employeeId,
        username: validatedData.username,
        name: validatedData.name,
        email: validatedData.email,
        passwordHash: hashed,
        role: validatedData.role,
        roleId: roleRecord?.id || null,
        department: validatedData.department || null,
        status: validatedData.status,
        organizationId: session.user.role === "DEVELOPER" ? (body.organizationId || null) : session.user.organizationId,
        assignedProducts: {
          connect: validatedData.productIds.map((id) => ({ id }))
        },
        assignedCustomers: {
          connect: validatedData.customerIds.map((id) => ({ id }))
        }
      }
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        module: "USERS",
        status: "SUCCESS",
        details: `Created User Account ${user.username} (${user.role})`
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
