import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { orderSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = orderSchema.parse(body);

    const { items, totalAmount, deliveryStreet, deliveryCity, deliveryPhone } = validatedData;

    // Safely cast user to a structural type to access .id
    const user = session.user as { id?: string; email?: string; name?: string; image?: string };
    const userId = user.id || "demo-user-1";
    const userEmail = user.email || "demo@local";

    // Ensure the user exists in database since we are using a mock CredentialsProvider
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        name: user.name || "Demo User",
        email: userEmail,
        image: user.image,
      }
    });

    const order = await prisma.order.create({
      data: {
        userId: userId,
        totalAmount,
        status: "PENDING",
        deliveryAddress: deliveryStreet,
        deliveryCity: deliveryCity,
        deliveryPhone: deliveryPhone,
        items: {
          create: items.map((item: { id: string; quantity: number; price: number }) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("[CHECKOUT_POST]", error);
    if (error && typeof error === 'object' && 'name' in error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

