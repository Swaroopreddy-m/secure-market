import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!orderId) {
      return NextResponse.json({ error: "Missing Order ID" }, { status: 400 });
    }

    const user = session.user as { id?: string; email?: string; name?: string };
    const userId = user.id || "demo-user-1";

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
        userId: userId, // Ensure secure access by limiting to owner
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("[ORDER_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
