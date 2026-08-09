import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET: Fetch pending merchant requests (Categories, Products, Inventory, Prices, Images)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PRODUCT_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const appId = user.applicationId;

    const [categories, products, inventories, prices, images] = await Promise.all([
      prisma.merchantCategory.findMany({
        where: { applicationId: appId, approvalStatus: "PENDING" },
        orderBy: { createdAt: "desc" }
      }),
      prisma.merchantProduct.findMany({
        where: { applicationId: appId, approvalStatus: "PENDING" },
        include: { category: true },
        orderBy: { createdAt: "desc" }
      }),
      prisma.merchantInventory.findMany({
        where: { applicationId: appId, approvalStatus: "PENDING" },
        include: { product: true },
        orderBy: { createdAt: "desc" }
      }),
      prisma.merchantPrice.findMany({
        where: { applicationId: appId, approvalStatus: "PENDING" },
        include: { product: true },
        orderBy: { createdAt: "desc" }
      }),
      prisma.merchantImage.findMany({
        where: { applicationId: appId, approvalStatus: "PENDING" },
        include: { product: true },
        orderBy: { createdAt: "desc" }
      })
    ]);

    return NextResponse.json({
      categories,
      products,
      inventories,
      prices,
      images
    });
  } catch (error) {
    console.error("[MERCHANT_REQUESTS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

// POST: Process Checker Actions (Approve, Reject, Return)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PRODUCT_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const body = await request.json();
    const { ids, type, action, remarks } = body; // type is: CATEGORY, PRODUCT, INVENTORY, PRICE, IMAGE

    if (!ids || !Array.isArray(ids) || ids.length === 0 || !type || !action) {
      return NextResponse.json({ error: "Invalid payload parameters." }, { status: 400 });
    }

    // Verify dual approval constraint configuration
    const dualApprovalCfg = await prisma.configuration.findUnique({
      where: { key: "MAKER_CHECKER_DUAL_APPROVAL" }
    });
    const dualApprovalRequired = dualApprovalCfg?.value !== "false";

    // Enforce remarks rules
    if ((action === "REJECT" || action === "RETURN") && !remarks?.trim()) {
      return NextResponse.json({ error: "Remarks are mandatory for Reject and Return actions." }, { status: 400 });
    }

    const checkerUsername = user.username || user.email;
    const processedIds: string[] = [];

    // Helper function to check dual approval violation
    const checkDualApproval = (maker: string | null) => {
      if (dualApprovalRequired && maker === checkerUsername) {
        throw new Error("Security Violation: Maker cannot approve their own request.");
      }
    };

    // 1. Process Categories
    if (type === "CATEGORY") {
      for (const id of ids) {
        const cat = await prisma.merchantCategory.findUnique({ where: { id } });
        if (!cat) continue;
        checkDualApproval(cat.makerUsername);

        let finalStatus = cat.status;
        let approvalStatus = action === "APPROVE" ? "APPROVED" : (action === "REJECT" ? "REJECTED" : "RETURNED");

        if (action === "APPROVE") {
          if (cat.status === "PENDING_DELETE") {
            await prisma.merchantCategory.delete({ where: { id } });
            processedIds.push(id);
            continue;
          } else {
            finalStatus = "ACTIVE";
          }
        } else {
          finalStatus = "INACTIVE";
        }

        await prisma.merchantCategory.update({
          where: { id },
          data: {
            approvalStatus,
            status: finalStatus,
            remarks: remarks || cat.remarks,
            checkerUsername
          }
        });
        processedIds.push(id);
      }
    }

    // 2. Process Products
    else if (type === "PRODUCT") {
      for (const id of ids) {
        const prod = await prisma.merchantProduct.findUnique({
          where: { id },
          include: { category: true, prices: true, images: true, inventories: true }
        });
        if (!prod) continue;
        checkDualApproval(prod.makerUsername);

        let finalStatus = prod.status;
        let approvalStatus = action === "APPROVE" ? "APPROVED" : (action === "REJECT" ? "REJECTED" : "RETURNED");

        if (action === "APPROVE") {
          if (prod.status === "PENDING_DELETE") {
            await prisma.merchantProduct.delete({ where: { id } });
            await prisma.storeProduct.deleteMany({ where: { id } });
            processedIds.push(id);
            continue;
          } else {
            finalStatus = "ACTIVE";
          }
        } else {
          finalStatus = "INACTIVE";
        }

        const updated = await prisma.merchantProduct.update({
          where: { id },
          data: {
            approvalStatus,
            status: finalStatus,
            remarks: remarks || prod.remarks,
            checkerUsername
          }
        });

        // Mirror/Upsert to StoreProduct on product approval
        if (action === "APPROVE") {
          const categoryName = prod.category?.name || "Grocery";
          const primaryImg = prod.images.find(img => img.isPrimary) || prod.images[0];
          const imageUrl = primaryImg ? primaryImg.url : "/images/products/placeholder.png";

          const activePrice = prod.prices.find(p => p.status === "ACTIVE") || prod.prices[0];
          const priceVal = activePrice ? activePrice.sellingPrice : 0.0;
          const disc = activePrice ? activePrice.discount : 0.0;

          const totalStock = prod.inventories.reduce((acc, inv) => acc + inv.quantity, 0);

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
              applicationId: prod.applicationId,
              organizationId: prod.organizationId,
              description: updated.shortDescription || "",
              stock: totalStock,
              discount: disc
            },
            update: {
              name: updated.name,
              price: priceVal,
              unit: updated.unit || "pcs",
              category: categoryName,
              image: imageUrl,
              inStock: totalStock > 0,
              description: updated.shortDescription || "",
              stock: totalStock,
              discount: disc
            }
          });
        }

        processedIds.push(id);
      }
    }

    // 3. Process Inventory
    else if (type === "INVENTORY") {
      for (const id of ids) {
        const inv = await prisma.merchantInventory.findUnique({ where: { id } });
        if (!inv) continue;
        checkDualApproval(inv.makerUsername);

        let approvalStatus = action === "APPROVE" ? "APPROVED" : (action === "REJECT" ? "REJECTED" : "RETURNED");
        let finalStatus = action === "APPROVE" ? "ACTIVE" : "INACTIVE";

        await prisma.merchantInventory.update({
          where: { id },
          data: {
            approvalStatus,
            status: finalStatus,
            remarks: remarks || inv.remarks,
            checkerUsername
          }
        });

        // Recalculate stock and sync
        if (action === "APPROVE") {
          const allApprovedInv = await prisma.merchantInventory.findMany({
            where: { productId: inv.productId, approvalStatus: "APPROVED" }
          });
          const stockSum = allApprovedInv.reduce((acc, i) => acc + i.quantity, 0);

          await prisma.storeProduct.updateMany({
            where: { id: inv.productId },
            data: {
              stock: stockSum,
              inStock: stockSum > 0
            }
          });
        }

        processedIds.push(id);
      }
    }

    // 4. Process Pricing
    else if (type === "PRICE") {
      for (const id of ids) {
        const price = await prisma.merchantPrice.findUnique({ where: { id } });
        if (!price) continue;
        checkDualApproval(price.makerUsername);

        let approvalStatus = action === "APPROVE" ? "APPROVED" : (action === "REJECT" ? "REJECTED" : "RETURNED");
        let finalStatus = action === "APPROVE" ? "ACTIVE" : "INACTIVE";

        const updatedPrice = await prisma.merchantPrice.update({
          where: { id },
          data: {
            approvalStatus,
            status: finalStatus,
            remarks: remarks || price.remarks,
            checkerUsername
          }
        });

        if (action === "APPROVE") {
          // Deactivate other prices
          await prisma.merchantPrice.updateMany({
            where: {
              productId: price.productId,
              id: { not: price.id }
            },
            data: { status: "INACTIVE" }
          });

          // Sync to StoreProduct price
          await prisma.storeProduct.updateMany({
            where: { id: price.productId },
            data: {
              price: updatedPrice.sellingPrice,
              discount: updatedPrice.discount
            }
          });
        }

        processedIds.push(id);
      }
    }

    // 5. Process Images
    else if (type === "IMAGE") {
      for (const id of ids) {
        const img = await prisma.merchantImage.findUnique({ where: { id } });
        if (!img) continue;
        checkDualApproval(img.makerUsername);

        let approvalStatus = action === "APPROVE" ? "APPROVED" : (action === "REJECT" ? "REJECTED" : "RETURNED");
        let finalStatus = action === "APPROVE" ? "ACTIVE" : "INACTIVE";

        const updatedImg = await prisma.merchantImage.update({
          where: { id },
          data: {
            approvalStatus,
            status: finalStatus,
            remarks: remarks || img.remarks,
            checkerUsername
          }
        });

        // Set primary details on StoreProduct
        if (action === "APPROVE" && updatedImg.isPrimary) {
          // De-primary other approved images
          await prisma.merchantImage.updateMany({
            where: {
              productId: img.productId,
              id: { not: img.id },
              isPrimary: true
            },
            data: { isPrimary: false }
          });

          await prisma.storeProduct.updateMany({
            where: { id: img.productId },
            data: { image: updatedImg.url }
          });
        }

        processedIds.push(id);
      }
    }

    // Log in Audit Logs
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: `${type}_CHECKER_${action}`,
        module: type,
        status: "SUCCESS",
        details: `Checker processed ${action} decision for ${processedIds.length} ${type} records. Remarks: ${remarks || "N/A"}`
      }
    });

    return NextResponse.json({ success: true, count: processedIds.length });
  } catch (error: any) {
    console.error("[MERCHANT_REQUESTS_POST]", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 400 });
  }
}
