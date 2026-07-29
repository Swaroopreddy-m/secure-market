import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

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
  type: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
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

    const parsedExpiry = data.expiryDate ? new Date(data.expiryDate) : null;

    // Create Organization
    const org = await prisma.organization.create({
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
        type: data.type || "Retail Store",
        remarks: data.remarks || "",
      }
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_ORGANIZATION",
        module: "ORGANIZATIONS",
        status: "SUCCESS",
        details: `Created Organization ${org.name} (${org.code})`
      }
    });

    return NextResponse.json({ success: true, organizationId: org.id });
  } catch (error) {
    console.error("[ORGANIZATIONS_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
