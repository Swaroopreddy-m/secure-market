import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET: Fetch products created by the Merchant User
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
    console.error("[MERCHANT_PRODUCTS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

// POST: Create a Product (Maker)
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

    if (!rights.includes("product create") && !rights.includes("products")) {
      return NextResponse.json({ error: "Access Denied: You do not have permissions to create products." }, { status: 403 });
    }

    const body = await request.json();
    const { 
      categoryId, name, brand, sku, barcode, shortDescription, 
      longDescription, unit, weight, dimensions, tax, hsnCode, 
      status, remarks, submitStatus 
    } = body;

    if (!categoryId || !name) {
      return NextResponse.json({ error: "Category and Product Name are required." }, { status: 400 });
    }

    // Verify Category exists and belongs to the user
    const cat = await prisma.merchantCategory.findUnique({
      where: { id: categoryId }
    });

    if (!cat || cat.userId !== user.id) {
      return NextResponse.json({ error: "Invalid Category selection." }, { status: 400 });
    }

    // Generate sequential product code
    const count = await prisma.merchantProduct.count({
      where: { applicationId: user.applicationId }
    });
    const code = `PROD-${(count + 1).toString().padStart(4, "0")}`;

    // Read configurations to check approval mode
    const configs = await prisma.configuration.findMany({
      where: {
        key: { in: ["ENABLE_PRODUCT_MAKER_CHECKER", "DEFAULT_APPROVAL_MODE"] }
      }
    });

    const configMap = new Map(configs.map(c => [c.key, c.value]));
    const makerCheckerEnabled = configMap.get("ENABLE_PRODUCT_MAKER_CHECKER") !== "false";
    const defaultMode = configMap.get("DEFAULT_APPROVAL_MODE") || "MAKER_CHECKER";

    // Determine initial statuses
    let approvalStatus = "PENDING";
    let finalStatus = "INACTIVE";

    if (submitStatus === "DRAFT") {
      approvalStatus = "DRAFT";
      finalStatus = "INACTIVE";
    } else {
      if (!makerCheckerEnabled || defaultMode === "DIRECT_PUBLISH") {
        approvalStatus = "APPROVED";
        finalStatus = status || "ACTIVE";
      } else {
        approvalStatus = "PENDING";
        finalStatus = "INACTIVE";
      }
    }

    // Create the product
    const product = await prisma.merchantProduct.create({
      data: {
        categoryId,
        name,
        code,
        brand: brand || null,
        sku: sku || null,
        barcode: barcode || null,
        shortDescription: shortDescription || null,
        longDescription: longDescription || null,
        unit: unit || "pcs",
        weight: weight ? parseFloat(weight) : null,
        dimensions: dimensions || null,
        tax: tax ? parseFloat(tax) : 0.0,
        hsnCode: hsnCode || null,
        status: finalStatus,
        approvalStatus,
        remarks: remarks || null,
        makerUsername: user.username || user.email,
        userId: user.id,
        applicationId: user.applicationId,
        organizationId: user.organizationId,
        version: 1
      }
    });

    // Create initial version history snapshot
    await prisma.merchantProductHistory.create({
      data: {
        productId: product.id,
        name: product.name,
        categoryId: product.categoryId,
        brand: product.brand,
        sku: product.sku,
        barcode: product.barcode,
        shortDescription: product.shortDescription,
        longDescription: product.longDescription,
        unit: product.unit || "pcs",
        weight: product.weight,
        dimensions: product.dimensions,
        tax: product.tax,
        hsnCode: product.hsnCode,
        status: product.status,
        version: 1,
        action: "CREATE",
        details: "Initial product creation.",
        changedBy: user.username || user.email || "System"
      }
    });

    // If Direct Publish is enabled, sync to global Marketplace table (StoreProduct)
    if (approvalStatus === "APPROVED") {
      await prisma.storeProduct.create({
        data: {
          id: product.id, // match ID for reference
          name: product.name,
          price: 0.0, // Initial price is 0.0 until prices are approved/added
          unit: product.unit || "pcs",
          category: cat.name,
          image: "/images/products/placeholder.png", // fallback placeholder
          inStock: false,
          applicationId: user.applicationId,
          organizationId: user.organizationId,
          description: product.shortDescription || "",
          stock: 0
        }
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: approvalStatus === "APPROVED" ? "PRODUCT_PUBLISHED" : "PRODUCT_CREATED",
        module: "PRODUCT",
        status: "SUCCESS",
        details: `Created product: ${name} (${code}) with status ${approvalStatus}`
      }
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("[MERCHANT_PRODUCTS_POST]", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
