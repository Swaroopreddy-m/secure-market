import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { orderSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = orderSchema.parse(body);

    const { items, totalAmount, deliveryStreet, deliveryCity, deliveryPhone } = validatedData;

    // Safely cast user to a structural type to access .id
    const user = session.user as { id?: string; email?: string; name?: string; image?: string };
    const userId = user.id || "demo-user-1";
    const userEmail = user.email || "demo@local";

    // Ensure the user exists in database since we are using a mock CredentialsProvider
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        name: user.name || "Demo User",
        email: userEmail,
        image: user.image,
      }
    });

    // Execute the checkout order validation and stock deduction inside a transaction
    const order = await prisma.$transaction(async (tx) => {
      // 1. Enforce stock verification and FIFO stock level deductions
      for (const item of items) {
        const invs = await tx.merchantInventory.findMany({
          where: {
            productId: item.id,
            status: "ACTIVE",
            approvalStatus: "APPROVED"
          },
          orderBy: { createdAt: "asc" } // FIFO
        });

        const totalStock = invs.reduce((acc, inv) => acc + inv.quantity, 0);
        if (item.quantity > totalStock) {
          throw new Error(`Insufficient stock for product. Available: ${totalStock}, Requested: ${item.quantity}`);
        }

        let remainingDeduction = item.quantity;
        for (const inv of invs) {
          if (remainingDeduction <= 0) break;

          if (inv.quantity >= remainingDeduction) {
            await tx.merchantInventory.update({
              where: { id: inv.id },
              data: {
                quantity: inv.quantity - remainingDeduction,
                availableQuantity: inv.availableQuantity - remainingDeduction,
                status: inv.quantity - remainingDeduction === 0 ? "INACTIVE" : "ACTIVE"
              }
            });
            remainingDeduction = 0;
          } else {
            await tx.merchantInventory.update({
              where: { id: inv.id },
              data: {
                quantity: 0,
                availableQuantity: 0,
                status: "INACTIVE"
              }
            });
            remainingDeduction -= inv.quantity;
          }
        }

        // 2. Project/update stock levels on Marketplace StoreProduct
        const updatedInvs = await tx.merchantInventory.findMany({
          where: {
            productId: item.id,
            status: "ACTIVE",
            approvalStatus: "APPROVED"
          }
        });
        const stockSum = updatedInvs.reduce((acc, inv) => acc + inv.quantity, 0);
        await tx.storeProduct.updateMany({
          where: { id: item.id },
          data: {
            stock: stockSum,
            inStock: stockSum > 0
          }
        });
      }

      // 3. Create the order
      return await tx.order.create({
        data: {
          userId: userId,
          totalAmount,
          status: "PENDING",
          deliveryAddress: deliveryStreet,
          deliveryCity: deliveryCity,
          deliveryPhone: deliveryPhone,
          items: {
            create: items.map((item: { id: string; quantity: number; price: number }) => ({
              productId: item.id,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      });
    });

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("[CHECKOUT_POST]", error);
    if (error && typeof error === 'object' && 'name' in error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}

