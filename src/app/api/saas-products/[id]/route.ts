import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const saasProductUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  code: z.string().min(1, "Code is required").optional(),
  category: z.string().min(1, "Category is required").optional(),
  description: z.string().optional(),
  version: z.string().optional(),
  status: z.string().optional(),
  owner: z.string().min(1, "Owner is required").optional(),
  environment: z.string().optional(),
  documentationUrl: z.string().url().optional().or(z.literal("")),
  repositoryUrl: z.string().url().optional().or(z.literal("")),
  releaseNotes: z.string().optional()
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return NextResponse.json({ error: "SaaS Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("[SAAS_PRODUCT_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    // Developer can modify, edit, delete. Super Admin can only edit.
    if (!session || !["DEVELOPER", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = saasProductUpdateSchema.parse(body);

    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Code uniqueness check if changed
    if (validatedData.code && validatedData.code !== existingProduct.code) {
      const dupe = await prisma.product.findUnique({
        where: { code: validatedData.code }
      });
      if (dupe) {
        return NextResponse.json({ error: "Product code already exists" }, { status: 400 });
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: validatedData.name,
        code: validatedData.code,
        category: validatedData.category,
        description: validatedData.description !== undefined ? (validatedData.description || null) : undefined,
        version: validatedData.version,
        status: validatedData.status,
        owner: validatedData.owner,
        environment: validatedData.environment,
        documentationUrl: validatedData.documentationUrl !== undefined ? (validatedData.documentationUrl || null) : undefined,
        repositoryUrl: validatedData.repositoryUrl !== undefined ? (validatedData.repositoryUrl || null) : undefined,
        releaseNotes: validatedData.releaseNotes !== undefined ? (validatedData.releaseNotes || null) : undefined
      }
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        module: "PRODUCTS",
        status: "SUCCESS",
        details: `Updated SaaS Product ${updated.code}: ${updated.name}`
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[SAAS_PRODUCT_PATCH]", error);
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

    // Only DEVELOPER can delete SaaS products
    if (!session || session.user.role !== "DEVELOPER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id }
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        module: "PRODUCTS",
        status: "SUCCESS",
        details: `Deleted SaaS Product ${product.code}: ${product.name}`
      }
    });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("[SAAS_PRODUCT_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
