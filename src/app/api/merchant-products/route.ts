import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const storeProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.number().positive("Price must be positive"),
  unit: z.string().default("1 kg"),
  category: z.string().default("Fresh Vegetables"),
  image: z.string().default("/images/products/vegetables.jpg"),
  inStock: z.boolean().default(true),
  discount: z.number().min(0).default(0),
  quality: z.string().default("Premium"),
  description: z.string().optional().default(""),
  stock: z.number().int().nonnegative().default(100),
  images: z.array(z.string()).optional().default([])
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["DEVELOPER", "SUPER_ADMIN", "USER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = storeProductSchema.parse(body);

    const newProduct = await prisma.storeProduct.create({
      data: {
        name: validatedData.name,
        price: validatedData.price,
        unit: validatedData.unit,
        category: validatedData.category,
        image: validatedData.image,
        inStock: validatedData.inStock,
        discount: validatedData.discount,
        quality: validatedData.quality,
        description: validatedData.description,
        stock: validatedData.stock,
        images: JSON.stringify(validatedData.images)
      }
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        module: "INVENTORY",
        status: "SUCCESS",
        details: `Created Store Product ${newProduct.name} (₹${newProduct.price})`
      }
    });

    return NextResponse.json(newProduct);
  } catch (error) {
    console.error("[MERCHANT_PRODUCT_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
