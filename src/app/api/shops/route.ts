import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    const orgId = session.user.organizationId;

    let whereClause = {};
    if (role !== "DEVELOPER") {
      if (!orgId) {
        return NextResponse.json([]);
      }
      whereClause = { organizationId: orgId };
    }

    const shops = await prisma.shop.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(shops);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["DEVELOPER", "SUPER_ADMIN", "PRODUCT_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, logo, description, applicationId } = body;
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const orgId = session.user.role === "DEVELOPER" ? (body.organizationId || null) : session.user.organizationId;

    const newShop = await prisma.shop.create({
      data: {
        name,
        logo: logo || "/images/shops/default.png",
        description,
        applicationId: applicationId || null,
        organizationId: orgId
      }
    });
    return NextResponse.json(newShop);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
