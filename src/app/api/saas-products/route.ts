import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const saasProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  version: z.string().default("1.0.0"),
  status: z.string().default("ACTIVE"),
  owner: z.string().min(1, "Owner is required"),
  environment: z.string().default("PRODUCTION"),
  documentationUrl: z.string().url().optional().or(z.literal("")),
  repositoryUrl: z.string().url().optional().or(z.literal("")),
  releaseNotes: z.string().optional()
});

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { code: "asc" }
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("[SAAS_PRODUCTS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["DEVELOPER", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = saasProductSchema.parse(body);

    // Check code unique
    const existing = await prisma.product.findUnique({
      where: { code: validatedData.code }
    });

    if (existing) {
      return NextResponse.json({ error: "Product code already exists" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name: validatedData.name,
        code: validatedData.code,
        category: validatedData.category,
        description: validatedData.description || null,
        version: validatedData.version,
        status: validatedData.status,
        owner: validatedData.owner,
        environment: validatedData.environment,
        documentationUrl: validatedData.documentationUrl || null,
        repositoryUrl: validatedData.repositoryUrl || null,
        releaseNotes: validatedData.releaseNotes || null
      }
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        module: "PRODUCTS",
        status: "SUCCESS",
        details: `Created SaaS Product ${product.code}: ${product.name}`
      }
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("[SAAS_PRODUCTS_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
