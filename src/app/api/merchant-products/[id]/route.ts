import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const storeProductUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  unit: z.string().optional(),
  category: z.string().optional(),
  image: z.string().optional(),
  inStock: z.boolean().optional(),
  discount: z.number().min(0).optional(),
  quality: z.string().optional(),
  description: z.string().optional(),
  stock: z.number().int().nonnegative().optional(),
  images: z.array(z.string()).optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !["DEVELOPER", "SUPER_ADMIN", "USER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = storeProductUpdateSchema.parse(body);

    const existing = await prisma.storeProduct.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const updateData: any = { ...validatedData };
    if (validatedData.images !== undefined) {
      updateData.images = JSON.stringify(validatedData.images);
    }

    const updated = await prisma.storeProduct.update({
      where: { id },
      data: updateData
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        module: "INVENTORY",
        status: "SUCCESS",
        details: `Updated Store Product ${updated.name} (inStock: ${updated.inStock})`
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[MERCHANT_PRODUCT_PATCH]", error);
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

    if (!session || !["DEVELOPER", "SUPER_ADMIN", "USER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.storeProduct.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.storeProduct.delete({
      where: { id }
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        module: "INVENTORY",
        status: "SUCCESS",
        details: `Deleted Store Product ${existing.name}`
      }
    });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("[MERCHANT_PRODUCT_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
