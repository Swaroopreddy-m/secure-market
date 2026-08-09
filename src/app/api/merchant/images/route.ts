import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

// GET: Fetch product images created by the Merchant User
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "USER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    const images = await prisma.merchantImage.findMany({
      where: {
        userId: user.id,
        applicationId: user.applicationId
      },
      include: {
        product: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(images);
  } catch (error) {
    console.error("[MERCHANT_IMAGES_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

// POST: Upload/Register a product image (Maker)
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

    if (!rights.includes("image upload") && !rights.includes("products")) {
      return NextResponse.json({ error: "Access Denied: You do not have permissions to upload images." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const productId = formData.get("productId") as string;
    const isPrimary = formData.get("isPrimary") === "true";
    const isThumbnail = formData.get("isThumbnail") === "true";
    const submitStatus = formData.get("submitStatus") as string || "PENDING";

    if (!file || !productId) {
      return NextResponse.json({ error: "File and Product ID are required." }, { status: 400 });
    }

    // Check size limit: 10MB
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File size exceeds 10MB limit." }, { status: 400 });
    }

    // Check file format
    const allowedFormats = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedFormats.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file format. Allowed formats: JPG, JPEG, PNG, WEBP." }, { status: 400 });
    }

    // Verify product ownership
    const prod = await prisma.merchantProduct.findUnique({
      where: { id: productId }
    });

    if (!prod || prod.userId !== user.id) {
      return NextResponse.json({ error: "Invalid product selection." }, { status: 400 });
    }

    // Save file buffer to local disk under /public/uploads/products/
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${prod.code}_${Date.now()}${path.extname(file.name)}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");

    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    const imageUrl = `/uploads/products/${filename}`;

    // Read configurations to check approval mode
    const configs = await prisma.configuration.findMany({
      where: {
        key: { in: ["ENABLE_PRODUCT_MAKER_CHECKER", "ENABLE_IMAGE_APPROVAL"] }
      }
    });

    const configMap = new Map(configs.map(c => [c.key, c.value]));
    const makerCheckerEnabled = configMap.get("ENABLE_PRODUCT_MAKER_CHECKER") !== "false";
    const imageApprovalEnabled = configMap.get("ENABLE_IMAGE_APPROVAL") !== "false";

    // Determine initial statuses
    let approvalStatus = "PENDING";
    let finalStatus = "INACTIVE";

    if (submitStatus === "DRAFT") {
      approvalStatus = "DRAFT";
      finalStatus = "INACTIVE";
    } else {
      if (!makerCheckerEnabled || !imageApprovalEnabled) {
        approvalStatus = "APPROVED";
        finalStatus = "ACTIVE";
      } else {
        approvalStatus = "PENDING";
        finalStatus = "INACTIVE";
      }
    }

    // If isPrimary is requested, and this is approved directly, de-primary previous images
    if (isPrimary && approvalStatus === "APPROVED") {
      await prisma.merchantImage.updateMany({
        where: { productId, isPrimary: true },
        data: { isPrimary: false }
      });
    }

    const merchantImage = await prisma.merchantImage.create({
      data: {
        productId,
        url: imageUrl,
        isPrimary,
        isThumbnail,
        status: finalStatus,
        approvalStatus,
        userId: user.id,
        applicationId: user.applicationId,
        organizationId: user.organizationId
      }
    });

    // If Direct Publish is enabled and it is primary, update marketplace image
    if (approvalStatus === "APPROVED" && isPrimary) {
      await prisma.storeProduct.updateMany({
        where: { id: productId },
        data: { image: imageUrl }
      });
    }

    // Write Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: approvalStatus === "APPROVED" ? "IMAGE_PUBLISHED" : "IMAGE_UPLOADED",
        module: "IMAGE",
        status: "SUCCESS",
        details: `Uploaded image for product ${prod.name}: ${imageUrl} with status ${approvalStatus}`
      }
    });

    return NextResponse.json(merchantImage);
  } catch (error: any) {
    console.error("[MERCHANT_IMAGES_POST]", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
