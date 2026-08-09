import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { productSchema } from "@/lib/validations";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const session = await getServerSession(authOptions);

    let organizationIdFilter = {};
    let applicationIdFilter = {};
    if (session && session.user && session.user.role !== "DEVELOPER") {
      organizationIdFilter = { organizationId: session.user.organizationId };
      if (session.user.applicationId) {
        applicationIdFilter = { applicationId: session.user.applicationId };
      }
    }

    // Only get products that correspond to APPROVED and ACTIVE MerchantProducts in the DB
    const merchantProductIds = (await prisma.merchantProduct.findMany({
      where: {
        approvalStatus: "APPROVED",
        status: "ACTIVE"
      },
      select: { id: true }
    })).map(p => p.id);

    const products = await prisma.storeProduct.findMany({
      where: {
        id: { in: merchantProductIds },
        AND: [
          category && category !== "All" ? { category } : {},
          organizationIdFilter,
          applicationIdFilter,
          {
            OR: [
              { shopId: null },
              {
                shop: {
                  status: "ACTIVE",
                  users: {
                    some: {
                      status: "ACTIVE"
                    }
                  }
                }
              }
            ]
          }
        ]
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("[PRODUCTS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["DEVELOPER", "SUPER_ADMIN", "ADMIN", "PRODUCT_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = productSchema.parse(body);

    const orgId = session.user.role === "DEVELOPER" ? (body.organizationId || null) : session.user.organizationId;

    const product = await prisma.storeProduct.create({
      data: {
        ...validatedData,
        organizationId: orgId
      }
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("[PRODUCTS_POST]", error);
    if (error && typeof error === 'object' && 'name' in error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

