import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const orgCreateSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  code: z.string().min(1, "Organization code is required"),
  logo: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  subscription: z.string().default("FREE"),
  theme: z.string().default("light"),
  status: z.string().default("ACTIVE"),
  owner: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  domain: z.string().optional().nullable(),

  // Super Admin Details
  adminEmployeeId: z.string().min(1, "Admin Employee ID is required"),
  adminUsername: z.string().min(1, "Admin Username is required"),
  adminName: z.string().min(1, "Admin Full Name is required"),
  adminEmail: z.string().email("Valid admin email is required"),
  adminPassword: z.string().min(6, "Admin password must be at least 6 characters"),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "DEVELOPER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizations = await prisma.organization.findMany({
      include: {
        users: {
          where: { role: "SUPER_ADMIN" },
          select: { id: true, name: true, email: true, username: true }
        },
        customers: true,
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(organizations);
  } catch (error) {
    console.error("[ORGANIZATIONS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "DEVELOPER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = orgCreateSchema.parse(body);

    // Verify Organization code and domain uniqueness
    const existingCode = await prisma.organization.findUnique({
      where: { code: data.code }
    });
    if (existingCode) {
      return NextResponse.json({ error: "Organization Code already exists" }, { status: 400 });
    }

    if (data.domain) {
      const existingDomain = await prisma.organization.findUnique({
        where: { domain: data.domain }
      });
      if (existingDomain) {
        return NextResponse.json({ error: "Domain name already registered" }, { status: 400 });
      }
    }

    // Verify Admin details uniqueness
    const existingUsername = await prisma.user.findUnique({
      where: { username: data.adminUsername }
    });
    if (existingUsername) {
      return NextResponse.json({ error: "Admin username already exists" }, { status: 400 });
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: data.adminEmail }
    });
    if (existingEmail) {
      return NextResponse.json({ error: "Admin email already exists" }, { status: 400 });
    }

    const existingEmp = await prisma.user.findUnique({
      where: { employeeId: data.adminEmployeeId }
    });
    if (existingEmp) {
      return NextResponse.json({ error: "Admin employee ID already exists" }, { status: 400 });
    }

    // Hash password
    const hashed = hashPassword(data.adminPassword);

    // Find roleId for SUPER_ADMIN
    const roleRecord = await prisma.role.findUnique({
      where: { name: "SUPER_ADMIN" }
    });

    const parsedExpiry = data.expiryDate ? new Date(data.expiryDate) : null;

    // Run creation in a Transaction
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: data.name,
          code: data.code,
          logo: data.logo || "/images/orgs/default.png",
          description: data.description,
          subscription: data.subscription,
          theme: data.theme,
          status: data.status,
          owner: data.owner,
          expiryDate: parsedExpiry,
          domain: data.domain || null,
        }
      });

      const user = await tx.user.create({
        data: {
          employeeId: data.adminEmployeeId,
          username: data.adminUsername,
          name: data.adminName,
          email: data.adminEmail,
          passwordHash: hashed,
          role: "SUPER_ADMIN",
          roleId: roleRecord?.id || null,
          status: "ACTIVE",
          department: "customers,users,reports,settings", // default Super Admin access rights
          organizationId: org.id
        }
      });

      return { org, user };
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_ORGANIZATION",
        module: "ORGANIZATIONS",
        status: "SUCCESS",
        details: `Created Organization ${result.org.name} (${result.org.code}) and Super Admin ${result.user.username}`
      }
    });

    return NextResponse.json({ success: true, organizationId: result.org.id });
  } catch (error) {
    console.error("[ORGANIZATIONS_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
