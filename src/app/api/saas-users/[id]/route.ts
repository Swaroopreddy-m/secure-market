import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const userUpdateSchema = z.object({
  employeeId: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional().or(z.literal("")),
  role: z.string().optional(),
  department: z.string().optional(),
  status: z.string().optional(),
  productIds: z.array(z.string()).optional(),
  customerIds: z.array(z.string()).optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !["DEVELOPER", "SUPER_ADMIN", "PRODUCT_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = userUpdateSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { id },
      include: {
        assignedProducts: true,
        assignedCustomers: true
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Enforce creation hierarchy on updates
    const creatorRole = session.user.role;
    const targetRole = validatedData.role;

    if (targetRole && targetRole !== existing.role) {
      if (creatorRole === "DEVELOPER" && targetRole !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Developer can only assign Super Admin roles." }, { status: 403 });
      }
      if (creatorRole === "SUPER_ADMIN" && !["PRODUCT_ADMIN", "USER"].includes(targetRole)) {
        return NextResponse.json({ error: "Super Admin can only assign Product Admin or Market User roles." }, { status: 403 });
      }
      if (creatorRole === "PRODUCT_ADMIN" && targetRole !== "USER") {
        return NextResponse.json({ error: "Product Admin can only assign User (Shop) roles." }, { status: 403 });
      }
    }

    // Unique checks
    if (validatedData.username && validatedData.username !== existing.username) {
      const dupe = await prisma.user.findUnique({
        where: { username: validatedData.username }
      });
      if (dupe) {
        return NextResponse.json({ error: "Username already exists" }, { status: 400 });
      }
    }

    if (validatedData.email && validatedData.email !== existing.email) {
      const dupe = await prisma.user.findUnique({
        where: { email: validatedData.email }
      });
      if (dupe) {
        return NextResponse.json({ error: "Email already exists" }, { status: 400 });
      }
    }

    if (validatedData.employeeId && validatedData.employeeId !== existing.employeeId) {
      const dupe = await prisma.user.findUnique({
        where: { employeeId: validatedData.employeeId }
      });
      if (dupe) {
        return NextResponse.json({ error: "Employee ID already exists" }, { status: 400 });
      }
    }

    // Hash password if changed
    const passHash = validatedData.password 
      ? hashPassword(validatedData.password)
      : undefined;

    // Resolve roleId
    let roleId: string | undefined = undefined;
    if (validatedData.role) {
      const roleRecord = await prisma.role.findUnique({
        where: { name: validatedData.role }
      });
      roleId = roleRecord?.id;
    }

    // Prepare relation connections
    const productConnect = validatedData.productIds 
      ? {
          set: [], // clear existing relations
          connect: validatedData.productIds.map(pid => ({ id: pid }))
        }
      : undefined;

    const customerConnect = validatedData.customerIds
      ? {
          set: [],
          connect: validatedData.customerIds.map(cid => ({ id: cid }))
        }
      : undefined;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        employeeId: validatedData.employeeId,
        username: validatedData.username,
        name: validatedData.name,
        email: validatedData.email,
        passwordHash: passHash,
        role: validatedData.role,
        roleId,
        department: validatedData.department,
        status: validatedData.status,
        assignedProducts: productConnect,
        assignedCustomers: customerConnect
      }
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        module: "USERS",
        status: "SUCCESS",
        details: `Updated User Account ${updated.username}`
      }
    });

    return NextResponse.json({ id: updated.id, username: updated.username });
  } catch (error) {
    console.error("[SAAS_USER_PATCH]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 505 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !["DEVELOPER", "SUPER_ADMIN", "PRODUCT_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Do not delete oneself
    if (user.id === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own active session account" }, { status: 400 });
    }

    // Enforce deletion hierarchy
    const creatorRole = session.user.role;
    const targetRole = user.role;

    if (creatorRole === "DEVELOPER" && targetRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Developer can only delete Super Admin users." }, { status: 403 });
    }
    if (creatorRole === "SUPER_ADMIN" && targetRole !== "PRODUCT_ADMIN") {
      return NextResponse.json({ error: "Super Admin can only delete Product Admin users." }, { status: 403 });
    }
    if (creatorRole === "PRODUCT_ADMIN" && targetRole !== "USER") {
      return NextResponse.json({ error: "Product Admin can only delete User (Shop) accounts." }, { status: 403 });
    }

    // Find all products associated with the user's shop
    const userProducts = user.shopId 
      ? await prisma.storeProduct.findMany({ where: { shopId: user.shopId } })
      : [];

    // Find all orders placed by the user or containing their products
    const userOrders = await prisma.order.findMany({
      where: {
        OR: [
          { userId: user.id },
          user.shopId ? { items: { some: { product: { shopId: user.shopId } } } } : {}
        ]
      },
      include: { items: true }
    });

    // Move products to ProductHistory and InventoryHistory
    if (userProducts.length > 0) {
      await prisma.productHistory.createMany({
        data: userProducts.map(p => ({
          productId: p.id,
          name: p.name,
          price: p.price,
          unit: p.unit,
          category: p.category,
          image: p.image || "",
          shopId: p.shopId
        }))
      });

      await prisma.inventoryHistory.createMany({
        data: userProducts.map(p => ({
          productId: p.id,
          productName: p.name,
          stock: p.stock
        }))
      });
    }

    // Move orders to OrderHistory
    if (userOrders.length > 0) {
      await prisma.orderHistory.createMany({
        data: userOrders.map(o => ({
          orderId: o.id,
          userId: o.userId,
          totalAmount: o.totalAmount,
          status: o.status
        }))
      });
    }

    // Execute transactional move/delete
    await prisma.$transaction([
      prisma.order.deleteMany({
        where: {
          id: { in: userOrders.map(o => o.id) }
        }
      }),
      prisma.storeProduct.deleteMany({
        where: {
          id: { in: userProducts.map(p => p.id) }
        }
      }),
      prisma.user.delete({
        where: { id }
      })
    ]);

    // Automatically purge history older than 365 days
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    try {
      await prisma.$transaction([
        prisma.productHistory.deleteMany({ where: { deletedAt: { lt: oneYearAgo } } }),
        prisma.orderHistory.deleteMany({ where: { deletedAt: { lt: oneYearAgo } } }),
        prisma.inventoryHistory.deleteMany({ where: { deletedAt: { lt: oneYearAgo } } })
      ]);
    } catch (e) {
      console.error("Failed to auto-purge expired history logs:", e);
    }

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        module: "USERS",
        status: "SUCCESS",
        details: `Deleted User Account ${user.username}`
      }
    });

    return NextResponse.json({ message: "User account deleted successfully" });
  } catch (error) {
    console.error("[SAAS_USER_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
