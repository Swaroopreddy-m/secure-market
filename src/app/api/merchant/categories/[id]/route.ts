import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

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

    const rights = user.department
      ? user.department.split(",").map((r: string) => r.trim().toLowerCase())
      : [];

    if (!rights.includes("category edit") && !rights.includes("categories")) {
      return NextResponse.json({ error: "Access Denied: You do not have permissions to edit categories." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, displayOrder, status, remarks, submitStatus } = body;

    // Fetch existing category
    const category = await prisma.merchantCategory.findUnique({
      where: { id }
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Strict multi-merchant data isolation
    if (category.userId !== user.id) {
      return NextResponse.json({ error: "Access Denied: You do not own this category." }, { status: 403 });
    }

    // Read configurations to check if approval is required
    const configs = await prisma.configuration.findMany({
      where: {
        key: { in: ["ENABLE_PRODUCT_MAKER_CHECKER", "ENABLE_CATEGORY_APPROVAL"] }
      }
    });
    
    const configMap = new Map(configs.map(c => [c.key, c.value]));
    const makerCheckerEnabled = configMap.get("ENABLE_PRODUCT_MAKER_CHECKER") !== "false";
    const categoryApprovalEnabled = configMap.get("ENABLE_CATEGORY_APPROVAL") !== "false";

    // Determine approvalStatus
    let approvalStatus = category.approvalStatus;
    let finalStatus = category.status;

    if (submitStatus === "DRAFT") {
      approvalStatus = "DRAFT";
      finalStatus = "INACTIVE";
    } else {
      if (!makerCheckerEnabled || !categoryApprovalEnabled) {
        approvalStatus = "APPROVED";
        finalStatus = status || "ACTIVE";
      } else {
        approvalStatus = "PENDING";
        finalStatus = "INACTIVE";
      }
    }

    const updated = await prisma.merchantCategory.update({
      where: { id },
      data: {
        name: name || category.name,
        description: description !== undefined ? description : category.description,
        displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : category.displayOrder,
        status: finalStatus,
        approvalStatus,
        remarks: remarks || category.remarks,
        makerUsername: user.username || user.email
      }
    });

    // Write Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CATEGORY_UPDATED",
        module: "CATEGORY",
        status: "SUCCESS",
        details: `Updated category: ${category.name} (${category.code}) to status ${approvalStatus}`
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[MERCHANT_CATEGORIES_PATCH]", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}

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

    const rights = user.department
      ? user.department.split(",").map((r: string) => r.trim().toLowerCase())
      : [];

    if (!rights.includes("category delete") && !rights.includes("categories")) {
      return NextResponse.json({ error: "Access Denied: You do not have permissions to delete categories." }, { status: 403 });
    }

    const { id } = await params;

    const category = await prisma.merchantCategory.findUnique({
      where: { id }
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (category.userId !== user.id) {
      return NextResponse.json({ error: "Access Denied: You do not own this category." }, { status: 403 });
    }

    // Read config
    const deleteApproval = await prisma.configuration.findUnique({
      where: { key: "ENABLE_DELETE_APPROVAL" }
    });
    const deleteApprovalEnabled = deleteApproval?.value !== "false";

    if (deleteApprovalEnabled) {
      const updated = await prisma.merchantCategory.update({
        where: { id },
        data: {
          approvalStatus: "PENDING",
          status: "PENDING_DELETE",
          remarks: "Pending deletion approval requested by merchant user."
        }
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "CATEGORY_DELETE_REQUESTED",
          module: "CATEGORY",
          status: "SUCCESS",
          details: `Requested deletion for category: ${category.name} (${category.code})`
        }
      });

      return NextResponse.json({ success: true, message: "Deletion request submitted for Checker approval.", data: updated });
    } else {
      await prisma.merchantCategory.delete({
        where: { id }
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "CATEGORY_DELETED",
          module: "CATEGORY",
          status: "SUCCESS",
          details: `Deleted category: ${category.name} (${category.code})`
        }
      });

      return NextResponse.json({ success: true, message: "Category deleted successfully." });
    }
  } catch (error: any) {
    console.error("[MERCHANT_CATEGORIES_DELETE]", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
