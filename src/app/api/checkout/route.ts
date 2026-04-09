import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { items, totalAmount, deliveryStreet, deliveryCity, deliveryPhone } = await request.json();

    if (!items || items.length === 0) {
      return new NextResponse("Cart is empty", { status: 400 });
    }

    if (!deliveryStreet || !deliveryCity || !deliveryPhone) {
      return new NextResponse("Delivery details missing", { status: 400 });
    }

    // Safely cast user to any to bypass TS error on .id
    const user = session.user as any;
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
          create: items.map((item: any) => ({
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
    return new NextResponse("Internal Error", { status: 500 });
  }
}
