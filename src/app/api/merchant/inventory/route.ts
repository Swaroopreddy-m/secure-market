import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "USER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    const products = await prisma.merchantProduct.findMany({
      where: {
        userId: user.id,
        applicationId: user.applicationId
      },
      include: {
        category: true,
        inventories: true,
        prices: true,
        images: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("[MERCHANT_INVENTORY_UNIFIED_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
