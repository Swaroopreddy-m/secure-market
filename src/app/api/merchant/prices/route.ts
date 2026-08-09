import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET: Fetch product prices created by the Merchant User
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "USER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    const prices = await prisma.merchantPrice.findMany({
      where: {
        userId: user.id,
        applicationId: user.applicationId
      },
      include: {
        product: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(prices);
  } catch (error) {
    console.error("[MERCHANT_PRICES_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

// POST: Create a product price (Maker)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "USER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    // Verify permission
    const rights = user.department
      ? user.department.split(",").map((r: string) => r.trim().toLowerCase())
      : [];

    if (!rights.includes("price create") && !rights.includes("price")) {
      return NextResponse.json({ error: "Access Denied: You do not have permissions to manage product prices." }, { status: 403 });
    }

    const body = await request.json();
    const { 
      productId, mrp, sellingPrice, offerPrice, gst, currency, 
      effectiveFrom, effectiveTo, status, remarks, submitStatus 
    } = body;

    if (!productId || mrp === undefined || sellingPrice === undefined) {
      return NextResponse.json({ error: "Product ID, MRP, and Selling Price are required." }, { status: 400 });
    }

    // Verify product ownership
    const prod = await prisma.merchantProduct.findUnique({
      where: { id: productId }
    });

    if (!prod || prod.userId !== user.id) {
      return NextResponse.json({ error: "Invalid product selection." }, { status: 400 });
    }

    // Read configurations to check approval mode
    const configs = await prisma.configuration.findMany({
      where: {
        key: { in: ["ENABLE_PRODUCT_MAKER_CHECKER", "ENABLE_PRICE_APPROVAL"] }
      }
    });

    const configMap = new Map(configs.map(c => [c.key, c.value]));
    const makerCheckerEnabled = configMap.get("ENABLE_PRODUCT_MAKER_CHECKER") !== "false";
    const priceApprovalEnabled = configMap.get("ENABLE_PRICE_APPROVAL") !== "false";

    // Determine initial statuses
    let approvalStatus = "PENDING";
    let finalStatus = "INACTIVE";

    if (submitStatus === "DRAFT") {
      approvalStatus = "DRAFT";
      finalStatus = "INACTIVE";
    } else {
      if (!makerCheckerEnabled || !priceApprovalEnabled) {
        approvalStatus = "APPROVED";
        finalStatus = status || "ACTIVE";
      } else {
        approvalStatus = "PENDING";
        finalStatus = "INACTIVE";
      }
    }

    const mrpVal = parseFloat(mrp);
    const sellVal = parseFloat(sellingPrice);
    const disc = mrpVal > 0 ? Math.max(0, ((mrpVal - sellVal) / mrpVal) * 100) : 0;

    const price = await prisma.merchantPrice.create({
      data: {
        productId,
        mrp: mrpVal,
        sellingPrice: sellVal,
        offerPrice: offerPrice ? parseFloat(offerPrice) : sellVal,
        discount: disc,
        gst: gst ? parseFloat(gst) : 0.0,
        currency: currency || "USD",
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null,
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
        status: finalStatus,
        approvalStatus,
        remarks: remarks || null,
        makerUsername: user.username || user.email,
        userId: user.id,
        applicationId: user.applicationId,
        organizationId: user.organizationId
      }
    });

    // If Direct Publish is enabled, set previous prices to INACTIVE and sync to global StoreProduct
    if (approvalStatus === "APPROVED") {
      await prisma.merchantPrice.updateMany({
        where: {
          productId,
          id: { not: price.id }
        },
        data: { status: "INACTIVE" }
      });

      await prisma.storeProduct.updateMany({
        where: { id: productId },
        data: {
          price: sellVal,
          discount: disc
        }
      });
    }

    // Write Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: approvalStatus === "APPROVED" ? "PRICE_APPROVED" : "PRICE_CREATED",
        module: "PRICE",
        status: "SUCCESS",
        details: `Created pricing for product ${prod.name}: MRP ${mrpVal}, Selling Price ${sellVal}, Discount ${disc.toFixed(1)}%`
      }
    });

    return NextResponse.json(price);
  } catch (error: any) {
    console.error("[MERCHANT_PRICES_POST]", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
