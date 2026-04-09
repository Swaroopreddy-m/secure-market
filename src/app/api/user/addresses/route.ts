import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = (session.user as any).id || "demo-user-1";
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error("[ADDRESSES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { street, city, phone } = await request.json();

    if (!street || !city || !phone) {
      return new NextResponse("Bad Request: missing fields", { status: 400 });
    }

    const userId = (session.user as any).id || "demo-user-1";

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
      }
    });

    return NextResponse.json(newAddress);
  } catch (error) {
    console.error("[ADDRESSES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
