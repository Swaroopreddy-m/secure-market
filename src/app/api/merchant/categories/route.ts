import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET: Fetch categories created by the Merchant User
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "USER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    const categories = await prisma.merchantCategory.findMany({
      where: {
        userId: user.id,
        applicationId: user.applicationId
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("[MERCHANT_CATEGORIES_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

// POST: Create a Category (Maker)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "USER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    // Verify Merchant User has permission "Category Create"
    const rights = user.department
      ? user.department.split(",").map((r: string) => r.trim().toLowerCase())
      : [];
    
    // Merchant permissions are checked from session department tokens
    if (!rights.includes("category create") && !rights.includes("categories")) {
      return NextResponse.json({ error: "Access Denied: You do not have permissions to create categories." }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, displayOrder, status, remarks, submitStatus } = body;

    if (!name) {
      return NextResponse.json({ error: "Category Name is required" }, { status: 400 });
    }

    // Generate unique sequential Category Code
    const count = await prisma.merchantCategory.count({
      where: { applicationId: user.applicationId }
    });
    const code = `CAT-${(count + 1).toString().padStart(4, "0")}`;

    // Read configurations to check if approval is required
    const configs = await prisma.configuration.findMany({
      where: {
        key: { in: ["ENABLE_PRODUCT_MAKER_CHECKER", "ENABLE_CATEGORY_APPROVAL"] }
      }
    });
    
    const configMap = new Map(configs.map(c => [c.key, c.value]));
    const makerCheckerEnabled = configMap.get("ENABLE_PRODUCT_MAKER_CHECKER") !== "false";
    const categoryApprovalEnabled = configMap.get("ENABLE_CATEGORY_APPROVAL") !== "false";

    // Determine initial approvalStatus
    let approvalStatus = "PENDING";
    let finalStatus = "INACTIVE";

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

    const category = await prisma.merchantCategory.create({
      data: {
        name,
        code,
        description,
        displayOrder: parseInt(displayOrder || "0"),
        status: finalStatus,
        approvalStatus,
        remarks: remarks || null,
        makerUsername: user.username || user.email,
        userId: user.id,
        applicationId: user.applicationId,
        organizationId: user.organizationId
      }
    });

    // Write Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: approvalStatus === "APPROVED" ? "CATEGORY_PUBLISHED" : "CATEGORY_CREATED",
        module: "CATEGORY",
        status: "SUCCESS",
        details: `Created category: ${name} (${code}) with status ${approvalStatus}`
      }
    });

    return NextResponse.json(category);
  } catch (error: any) {
    console.error("[MERCHANT_CATEGORIES_POST]", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
