import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET: Fetch inventory batches created by the Merchant User
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "USER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    const inventories = await prisma.merchantInventory.findMany({
      where: {
        userId: user.id,
        applicationId: user.applicationId
      },
      include: {
        product: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(inventories);
  } catch (error) {
    console.error("[MERCHANT_INVENTORY_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

// POST: Create or update an Inventory Batch (Maker)
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

    if (!rights.includes("inventory create") && !rights.includes("inventory")) {
      return NextResponse.json({ error: "Access Denied: You do not have permissions to manage inventory." }, { status: 403 });
    }

    const body = await request.json();
    const { 
      productId, batchNumber, quantity, minimumStock, maximumStock, 
      purchasePrice, sellingPrice, discount, offerPrice, 
      expiryDate, manufacturingDate, supplier, warehouse, status, remarks, submitStatus 
    } = body;

    if (!productId || quantity === undefined) {
      return NextResponse.json({ error: "Product ID and Quantity are required." }, { status: 400 });
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
        key: { in: ["ENABLE_PRODUCT_MAKER_CHECKER", "ENABLE_INVENTORY_APPROVAL"] }
      }
    });

    const configMap = new Map(configs.map(c => [c.key, c.value]));
    const makerCheckerEnabled = configMap.get("ENABLE_PRODUCT_MAKER_CHECKER") !== "false";
    const inventoryApprovalEnabled = configMap.get("ENABLE_INVENTORY_APPROVAL") !== "false";

    // Determine initial statuses
    let approvalStatus = "PENDING";
    let finalStatus = "INACTIVE";

    if (submitStatus === "DRAFT") {
      approvalStatus = "DRAFT";
      finalStatus = "INACTIVE";
    } else {
      if (!makerCheckerEnabled || !inventoryApprovalEnabled) {
        approvalStatus = "APPROVED";
        finalStatus = status || "ACTIVE";
      } else {
        approvalStatus = "PENDING";
        finalStatus = "INACTIVE";
      }
    }

    const qty = parseInt(quantity);

    const inventory = await prisma.merchantInventory.create({
      data: {
        productId,
        batchNumber: batchNumber || `BATCH-${Date.now().toString().slice(-6)}`,
        quantity: qty,
        availableQuantity: qty,
        minimumStock: minimumStock ? parseInt(minimumStock) : 0,
        maximumStock: maximumStock ? parseInt(maximumStock) : 1000,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : 0.0,
        sellingPrice: sellingPrice ? parseFloat(sellingPrice) : 0.0,
        discount: discount ? parseFloat(discount) : 0.0,
        offerPrice: offerPrice ? parseFloat(offerPrice) : 0.0,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        manufacturingDate: manufacturingDate ? new Date(manufacturingDate) : null,
        supplier: supplier || null,
        warehouse: warehouse || null,
        status: finalStatus,
        approvalStatus,
        remarks: remarks || null,
        makerUsername: user.username || user.email,
        userId: user.id,
        applicationId: user.applicationId,
        organizationId: user.organizationId
      }
    });

    // Write snapshot to inventory history model if audit enabled
    await prisma.inventoryHistory.create({
      data: {
        productId,
        productName: prod.name,
        stock: qty
      }
    });

    // If Direct Publish is enabled, recalculate product stock sum and update Marketplace StoreProduct
    if (approvalStatus === "APPROVED") {
      const allApprovedInv = await prisma.merchantInventory.findMany({
        where: { productId, approvalStatus: "APPROVED" }
      });
      const stockSum = allApprovedInv.reduce((acc, inv) => acc + inv.quantity, 0);

      await prisma.storeProduct.updateMany({
        where: { id: productId },
        data: {
          stock: stockSum,
          inStock: stockSum > 0
        }
      });
    }

    // Write Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: approvalStatus === "APPROVED" ? "INVENTORY_APPROVED" : "INVENTORY_CREATED",
        module: "INVENTORY",
        status: "SUCCESS",
        details: `Created stock batch: ${inventory.batchNumber} for product ${prod.name} with quantity ${qty}`
      }
    });

    return NextResponse.json(inventory);
  } catch (error: any) {
    console.error("[MERCHANT_INVENTORY_POST]", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
