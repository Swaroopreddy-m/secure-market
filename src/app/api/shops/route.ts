import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const shops = await prisma.shop.findMany({
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(shops);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, logo, description, applicationId } = body;
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const newShop = await prisma.shop.create({
      data: {
        name,
        logo: logo || "/images/shops/default.png",
        description,
        applicationId: applicationId || null
      }
    });
    return NextResponse.json(newShop);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
