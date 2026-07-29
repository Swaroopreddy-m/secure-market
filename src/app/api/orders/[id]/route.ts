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

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify role-based access
    let isAuthorized = false;
    const role = session.user.role;
    
    if (role === "DEVELOPER") {
      isAuthorized = true;
    } else if (role === "SUPER_ADMIN" || role === "PRODUCT_ADMIN") {
      if (order.organizationId === session.user.organizationId) {
        isAuthorized = true;
      }
    } else if (role === "USER") {
      const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
      const shopId = dbUser?.shopId;
      if (shopId && order.items.some(item => item.product.shopId === shopId)) {
        isAuthorized = true;
      }
    } else if (order.userId === session.user.id) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("[ORDER_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function PATCH(
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

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
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

    // Verify role-based access to change order status
    let isAuthorized = false;
    const role = session.user.role;

    if (role === "DEVELOPER") {
      isAuthorized = true;
    } else if (role === "SUPER_ADMIN" || role === "PRODUCT_ADMIN") {
      if (order.organizationId === session.user.organizationId) {
        isAuthorized = true;
      }
    } else if (role === "USER") {
      const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
      const shopId = dbUser?.shopId;
      if (shopId && order.items.some(item => item.product.shopId === shopId)) {
        isAuthorized = true;
      }
    } else if (order.userId === session.user.id) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_ORDER_STATUS",
        module: "ORDERS",
        status: "SUCCESS",
        details: `Updated Order ${orderId} status to ${status}`
      }
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("[ORDER_PATCH]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
