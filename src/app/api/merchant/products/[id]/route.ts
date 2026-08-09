import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// PATCH: Edit Product (Maker)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    if (!rights.includes("product edit") && !rights.includes("products")) {
      return NextResponse.json({ error: "Access Denied: You do not have permissions to edit products." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { 
      categoryId, name, brand, sku, barcode, shortDescription, 
      longDescription, unit, weight, dimensions, tax, hsnCode, 
      status, remarks, submitStatus 
    } = body;

    // Fetch existing product
    const product = await prisma.merchantProduct.findUnique({
      where: { id },
      include: {
        category: true,
        prices: true,
        images: true,
        inventories: true
      }
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    // Strict multi-merchant isolation
    if (product.userId !== user.id) {
      return NextResponse.json({ error: "Access Denied: You do not own this product." }, { status: 403 });
    }

    // Read configurations to check approval mode
    const configs = await prisma.configuration.findMany({
      where: {
        key: { in: ["ENABLE_PRODUCT_MAKER_CHECKER", "DEFAULT_APPROVAL_MODE"] }
      }
    });

    const configMap = new Map(configs.map(c => [c.key, c.value]));
    const makerCheckerEnabled = configMap.get("ENABLE_PRODUCT_MAKER_CHECKER") !== "false";
    const defaultMode = configMap.get("DEFAULT_APPROVAL_MODE") || "MAKER_CHECKER";

    // Determine approvalStatus
    let approvalStatus = product.approvalStatus;
    let finalStatus = product.status;

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

    const nextVersion = product.version + 1;

    // Update product
    const updated = await prisma.merchantProduct.update({
      where: { id },
      data: {
        categoryId: categoryId || product.categoryId,
        name: name || product.name,
        brand: brand !== undefined ? brand : product.brand,
        sku: sku !== undefined ? sku : product.sku,
        barcode: barcode !== undefined ? barcode : product.barcode,
        shortDescription: shortDescription !== undefined ? shortDescription : product.shortDescription,
        longDescription: longDescription !== undefined ? longDescription : product.longDescription,
        unit: unit || product.unit || "pcs",
        weight: weight !== undefined ? (weight ? parseFloat(weight) : null) : product.weight,
        dimensions: dimensions !== undefined ? dimensions : product.dimensions,
        tax: tax !== undefined ? parseFloat(tax) : product.tax,
        hsnCode: hsnCode !== undefined ? hsnCode : product.hsnCode,
        status: finalStatus,
        approvalStatus,
        remarks: remarks || product.remarks,
        makerUsername: user.username || user.email,
        version: nextVersion
      }
    });

    // Create version history snapshot
    await prisma.merchantProductHistory.create({
      data: {
        productId: product.id,
        name: updated.name,
        categoryId: updated.categoryId,
        brand: updated.brand,
        sku: updated.sku,
        barcode: updated.barcode,
        shortDescription: updated.shortDescription,
        longDescription: updated.longDescription,
        unit: updated.unit || "pcs",
        weight: updated.weight,
        dimensions: updated.dimensions,
        tax: updated.tax,
        hsnCode: updated.hsnCode,
        status: updated.status,
        version: nextVersion,
        action: "UPDATE",
        details: remarks || `Updated product details to version ${nextVersion}`,
        changedBy: user.username || user.email || "System"
      }
    });

    // If Direct Publish is active, sync immediately to Marketplace table
    if (approvalStatus === "APPROVED") {
      // Find category name
      const categoryObj = categoryId 
        ? await prisma.merchantCategory.findUnique({ where: { id: categoryId } }) 
        : product.category;

      const categoryName = categoryObj?.name || "Grocery";

      // Find primary image if exists
      const primaryImg = product.images.find(img => img.isPrimary) || product.images[0];
      const imageUrl = primaryImg ? primaryImg.url : "/images/products/placeholder.png";

      // Find active price if exists
      const activePrice = product.prices.find(p => p.status === "ACTIVE") || product.prices[0];
      const priceVal = activePrice ? activePrice.sellingPrice : 0.0;

      // Find active total quantity
      const totalStock = product.inventories.reduce((acc, inv) => acc + inv.quantity, 0);

      await prisma.storeProduct.upsert({
        where: { id },
        create: {
          id,
          name: updated.name,
          price: priceVal,
          unit: updated.unit || "pcs",
          category: categoryName,
          image: imageUrl,
          inStock: totalStock > 0,
          applicationId: user.applicationId,
          organizationId: user.organizationId,
          description: updated.shortDescription || "",
          stock: totalStock
        },
        update: {
          name: updated.name,
          price: priceVal,
          unit: updated.unit || "pcs",
          category: categoryName,
          image: imageUrl,
          inStock: totalStock > 0,
          description: updated.shortDescription || "",
          stock: totalStock
        }
      });
    }

    // Write Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PRODUCT_UPDATED",
        module: "PRODUCT",
        status: "SUCCESS",
        details: `Updated product: ${updated.name} (${updated.code}) to version ${nextVersion} status ${approvalStatus}`
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[MERCHANT_PRODUCTS_PATCH]", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}

// DELETE: Delete Product (Maker)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    if (!rights.includes("product delete") && !rights.includes("products")) {
      return NextResponse.json({ error: "Access Denied: You do not have permissions to delete products." }, { status: 403 });
    }

    const { id } = await params;

    const product = await prisma.merchantProduct.findUnique({
      where: { id }
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    if (product.userId !== user.id) {
      return NextResponse.json({ error: "Access Denied: You do not own this product." }, { status: 403 });
    }

    // Read config
    const deleteApproval = await prisma.configuration.findUnique({
      where: { key: "ENABLE_DELETE_APPROVAL" }
    });
    const deleteApprovalEnabled = deleteApproval?.value !== "false";

    if (deleteApprovalEnabled) {
      // Mark for deletion
      const updated = await prisma.merchantProduct.update({
        where: { id },
        data: {
          approvalStatus: "PENDING",
          status: "PENDING_DELETE",
          remarks: "Pending deletion approval requested by merchant."
        }
      });

      // Write snapshot to history
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
          status: "PENDING_DELETE",
          version: product.version + 1,
          action: "DELETE_REQUESTED",
          details: "Pending deletion approval requested.",
          changedBy: user.username || user.email || "System"
        }
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "PRODUCT_DELETE_REQUESTED",
          module: "PRODUCT",
          status: "SUCCESS",
          details: `Requested deletion for product: ${product.name} (${product.code})`
        }
      });

      return NextResponse.json({ success: true, message: "Deletion request submitted for Checker approval.", data: updated });
    } else {
      // Direct hard delete of product and remove from marketplace
      await prisma.merchantProduct.delete({
        where: { id }
      });

      // Remove from Marketplace
      await prisma.storeProduct.deleteMany({
        where: { id }
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "PRODUCT_DELETED",
          module: "PRODUCT",
          status: "SUCCESS",
          details: `Deleted product: ${product.name} (${product.code})`
        }
      });

      return NextResponse.json({ success: true, message: "Product deleted successfully from catalog and marketplace." });
    }
  } catch (error: any) {
    console.error("[MERCHANT_PRODUCTS_DELETE]", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
