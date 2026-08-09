import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET: Fetch product versions history
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "USER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const { id } = await params;

    // Verify ownership
    const product = await prisma.merchantProduct.findUnique({
      where: { id }
    });

    if (!product || product.userId !== user.id) {
      return NextResponse.json({ error: "Access Denied: Product not found or you do not own it." }, { status: 403 });
    }

    const history = await prisma.merchantProductHistory.findMany({
      where: { productId: id },
      orderBy: { timestamp: "desc" }
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("[MERCHANT_PRODUCTS_HISTORY_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

// POST: Restore a product version
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "USER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const { id } = await params;
    const body = await request.json();
    const { version } = body;

    if (!version) {
      return NextResponse.json({ error: "Version parameter is required." }, { status: 400 });
    }

    // Verify ownership
    const product = await prisma.merchantProduct.findUnique({
      where: { id }
    });

    if (!product || product.userId !== user.id) {
      return NextResponse.json({ error: "Access Denied: Product not found or you do not own it." }, { status: 403 });
    }

    // Verify Version Restore is enabled
    const restoreConfig = await prisma.configuration.findUnique({
      where: { key: "ENABLE_PRODUCT_RESTORE" }
    });
    if (restoreConfig?.value === "false") {
      return NextResponse.json({ error: "Version restoration is currently disabled by settings." }, { status: 403 });
    }

    // Find version snapshot
    const snapshot = await prisma.merchantProductHistory.findFirst({
      where: {
        productId: id,
        version: parseInt(version)
      }
    });

    if (!snapshot) {
      return NextResponse.json({ error: `Product Version ${version} not found.` }, { status: 404 });
    }

    const nextVersion = product.version + 1;

    // Restore category and details
    const restored = await prisma.merchantProduct.update({
      where: { id },
      data: {
        name: snapshot.name,
        categoryId: snapshot.categoryId,
        brand: snapshot.brand,
        sku: snapshot.sku,
        barcode: snapshot.barcode,
        shortDescription: snapshot.shortDescription,
        longDescription: snapshot.longDescription,
        unit: snapshot.unit || "pcs",
        weight: snapshot.weight,
        dimensions: snapshot.dimensions,
        tax: snapshot.tax || 0.0,
        hsnCode: snapshot.hsnCode,
        status: snapshot.status,
        version: nextVersion,
        approvalStatus: "APPROVED" // restored versions are typically active directly
      }
    });

    // Create history snapshot for the restore action
    await prisma.merchantProductHistory.create({
      data: {
        productId: id,
        name: restored.name,
        categoryId: restored.categoryId,
        brand: restored.brand,
        sku: restored.sku,
        barcode: restored.barcode,
        shortDescription: restored.shortDescription,
        longDescription: restored.longDescription,
        unit: restored.unit || "pcs",
        weight: restored.weight,
        dimensions: restored.dimensions,
        tax: restored.tax,
        hsnCode: restored.hsnCode,
        status: restored.status,
        version: nextVersion,
        action: "RESTORE",
        details: `Restored product details to version ${version}`,
        changedBy: user.username || user.email || "System"
      }
    });

    // Sync to Marketplace StoreProduct immediately
    const categoryObj = await prisma.merchantCategory.findUnique({
      where: { id: restored.categoryId }
    });
    
    // Find active price & image if exist
    const prices = await prisma.merchantPrice.findMany({ where: { productId: id } });
    const activePrice = prices.find(p => p.status === "ACTIVE") || prices[0];
    const priceVal = activePrice ? activePrice.sellingPrice : 0.0;

    const images = await prisma.merchantImage.findMany({ where: { productId: id } });
    const primaryImg = images.find(img => img.isPrimary) || images[0];
    const imageUrl = primaryImg ? primaryImg.url : "/images/products/placeholder.png";

    await prisma.storeProduct.upsert({
      where: { id },
      create: {
        id,
        name: restored.name,
        price: priceVal,
        unit: restored.unit || "pcs",
        category: categoryObj?.name || "Grocery",
        image: imageUrl,
        inStock: true,
        applicationId: user.applicationId,
        organizationId: user.organizationId,
        description: restored.shortDescription || "",
        stock: 100
      },
      update: {
        name: restored.name,
        price: priceVal,
        unit: restored.unit || "pcs",
        category: categoryObj?.name || "Grocery",
        image: imageUrl,
        description: restored.shortDescription || ""
      }
    });

    // Write Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PRODUCT_RESTORED",
        module: "PRODUCT",
        status: "SUCCESS",
        details: `Restored product: ${restored.name} (${restored.code}) to parameters of version ${version}`
      }
    });

    return NextResponse.json(restored);
  } catch (error: any) {
    console.error("[MERCHANT_PRODUCTS_RESTORE_POST]", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
