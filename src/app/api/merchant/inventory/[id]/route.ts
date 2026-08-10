import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET: Fetch individual product details for editing
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

    const product = await prisma.merchantProduct.findUnique({
      where: { id },
      include: {
        category: true,
        inventories: true,
        prices: true,
        images: true
      }
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    if (product.userId !== user.id) {
      return NextResponse.json({ error: "Access Denied: You do not own this product." }, { status: 403 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("[MERCHANT_INVENTORY_ITEM_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

// PUT: Unified update for merchant product, pricing, image, and inventory quantities
export async function PUT(
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
    const { 
      name, shortDescription, categoryId, price, quantity, availability, imageUrl 
    } = body;

    if (!name || !categoryId || price === undefined || quantity === undefined || !availability) {
      return NextResponse.json({ error: "Required fields are missing." }, { status: 400 });
    }

    const parsedPrice = parseFloat(price);
    const parsedQty = parseInt(quantity);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return NextResponse.json({ error: "Price must be a valid positive number." }, { status: 400 });
    }
    if (isNaN(parsedQty) || parsedQty < 0) {
      return NextResponse.json({ error: "Quantity must be a valid non-negative integer." }, { status: 400 });
    }

    // Verify ownership
    const product = await prisma.merchantProduct.findUnique({
      where: { id }
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    if (product.userId !== user.id) {
      return NextResponse.json({ error: "Access Denied: You do not own this product." }, { status: 403 });
    }

    // Perform transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update product basic details
      const updatedProduct = await tx.merchantProduct.update({
        where: { id },
        data: {
          name,
          shortDescription,
          categoryId,
          version: { increment: 1 }
        }
      });

      // 2. Upsert pricing
      const existingPrice = await tx.merchantPrice.findFirst({
        where: { productId: id, status: "ACTIVE" }
      });
      if (existingPrice) {
        await tx.merchantPrice.update({
          where: { id: existingPrice.id },
          data: { sellingPrice: parsedPrice, mrp: parsedPrice }
        });
      } else {
        await tx.merchantPrice.create({
          data: {
            productId: id,
            mrp: parsedPrice,
            sellingPrice: parsedPrice,
            status: "ACTIVE",
            approvalStatus: "APPROVED",
            userId: user.id,
            applicationId: user.applicationId,
            organizationId: user.organizationId
          }
        });
      }

      // 3. Upsert inventory status & quantity
      const isAvailable = availability === "AVAILABLE" && parsedQty > 0;
      const finalStatus = isAvailable ? "ACTIVE" : "INACTIVE";

      const existingInv = await tx.merchantInventory.findFirst({
        where: { productId: id, status: "ACTIVE" }
      });
      if (existingInv) {
        await tx.merchantInventory.update({
          where: { id: existingInv.id },
          data: {
            quantity: parsedQty,
            availableQuantity: parsedQty,
            status: finalStatus
          }
        });
      } else {
        await tx.merchantInventory.create({
          data: {
            productId: id,
            batchNumber: `BATCH-${Date.now().toString().slice(-6)}`,
            quantity: parsedQty,
            availableQuantity: parsedQty,
            status: finalStatus,
            approvalStatus: "APPROVED",
            userId: user.id,
            applicationId: user.applicationId,
            organizationId: user.organizationId
          }
        });
      }

      // 4. Update product primary image if provided
      if (imageUrl) {
        // De-primary older images
        await tx.merchantImage.updateMany({
          where: { productId: id, isPrimary: true },
          data: { isPrimary: false }
        });

        const existingImg = await tx.merchantImage.findFirst({
          where: { productId: id, url: imageUrl }
        });
        if (existingImg) {
          await tx.merchantImage.update({
            where: { id: existingImg.id },
            data: { isPrimary: true, status: "ACTIVE" }
          });
        } else {
          await tx.merchantImage.create({
            data: {
              productId: id,
              url: imageUrl,
              isPrimary: true,
              isThumbnail: true,
              status: "ACTIVE",
              approvalStatus: "APPROVED",
              userId: user.id,
              applicationId: user.applicationId,
              organizationId: user.organizationId
            }
          });
        }
      }

      // 5. Get category details
      const categoryObj = await tx.merchantCategory.findUnique({
        where: { id: categoryId }
      });
      const categoryName = categoryObj?.name || "Grocery";

      // 6. Recalculate stock sum across all ACTIVE approved inventories
      const allApprovedInv = await tx.merchantInventory.findMany({
        where: { productId: id, status: "ACTIVE", approvalStatus: "APPROVED" }
      });
      const stockSum = allApprovedInv.reduce((acc, inv) => acc + inv.quantity, 0);

      // 7. Get primary image URL
      const primaryImg = await tx.merchantImage.findFirst({
        where: { productId: id, isPrimary: true, status: "ACTIVE" }
      });
      const finalImageUrl = primaryImg ? primaryImg.url : (imageUrl || "/images/products/placeholder.png");

      // 8. Projection to Marketplace StoreProduct storefront table
      const storeProduct = await tx.storeProduct.upsert({
        where: { id },
        create: {
          id,
          name,
          price: parsedPrice,
          unit: updatedProduct.unit || "pcs",
          category: categoryName,
          image: finalImageUrl,
          inStock: stockSum > 0,
          applicationId: user.applicationId,
          organizationId: user.organizationId,
          description: shortDescription || "",
          stock: stockSum
        },
        update: {
          name,
          price: parsedPrice,
          unit: updatedProduct.unit || "pcs",
          category: categoryName,
          image: finalImageUrl,
          inStock: stockSum > 0,
          description: shortDescription || "",
          stock: stockSum
        }
      });

      // 9. Write version history snapshot
      await tx.merchantProductHistory.create({
        data: {
          productId: id,
          name,
          categoryId,
          status: finalStatus,
          version: updatedProduct.version,
          action: "UPDATE",
          details: `Updated details via Check Items Edit. Quantity: ${parsedQty}, Price: ${parsedPrice}`,
          changedBy: user.username || user.email || "System"
        }
      });

      // 10. Audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "INVENTORY_UPDATED",
          module: "INVENTORY",
          status: "SUCCESS",
          details: `Updated inventory for ${name}. Stock: ${parsedQty}, Price: ${parsedPrice}, Status: ${finalStatus}`
        }
      });

      return updatedProduct;
    });

    return NextResponse.json({ success: true, product: result });
  } catch (error: any) {
    console.error("[MERCHANT_INVENTORY_ITEM_PUT]", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
