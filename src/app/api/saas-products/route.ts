import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const productCreateSchema = z.object({
  name: z.string().min(1, "Product Name is required"),
  code: z.string().min(1, "Product Code is required"),
  category: z.string().default("Marketplace Portal"),
  description: z.string().optional(),
  version: z.string().default("1.0.0"),
  status: z.string().default("ACTIVE"),
  owner: z.string().default("Market Team"),
  environment: z.string().default("PRODUCTION")
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["DEVELOPER", "SUPER_ADMIN", "PRODUCT_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = productCreateSchema.parse(body);

    // Verify code uniqueness
    const existingProduct = await prisma.product.findUnique({
      where: { code: validatedData.code }
    });
    
    if (existingProduct) {
      return NextResponse.json({ error: "Product Code already exists" }, { status: 400 });
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
        environment: validatedData.environment
      }
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        module: "PRODUCTS",
        status: "SUCCESS",
        details: `Created SaaS Product ${product.name} (${product.code})`
      }
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("[SAAS_PRODUCT_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
