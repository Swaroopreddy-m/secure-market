import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { addressSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { id?: string; email?: string; name?: string };
    const userId = user.id || "demo-user-1";
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error("[ADDRESSES_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = addressSchema.parse(body);

    const { street, city, phone, isDefault } = validatedData;

    const user = session.user as { id?: string; email?: string; name?: string };
    const userId = user.id || "demo-user-1";

    // Ensure user exists (for demo mock reasons)
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        name: session.user.name || "Demo User",
        email: session.user.email || "demo@local",
      }
    });

    const newAddress = await prisma.address.create({
      data: {
        userId,
        street,
        city,
        phone,
        isDefault: isDefault || false,
      }
    });

    return NextResponse.json(newAddress);
  } catch (error) {
    console.error("[ADDRESSES_POST]", error);
    if (error && typeof error === 'object' && 'name' in error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

