import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const CONFIG_KEYS = [
  "MAKER_CHECKER_MAKER_ENABLED",
  "MAKER_CHECKER_CHECKER_ENABLED",
  "MAKER_CHECKER_DUAL_APPROVAL",
  "MAKER_CHECKER_BULK_APPROVAL",
  "MAKER_CHECKER_RETURN_WORKFLOW",
  "MAKER_CHECKER_REJECT_WORKFLOW",
  "MAKER_CHECKER_APPROVAL_REMARKS_MANDATORY",
  "MAKER_CHECKER_RETURN_REMARKS_MANDATORY",
  "MAKER_CHECKER_REJECT_REMARKS_MANDATORY",
  "MAKER_CHECKER_ROLE_MATRIX_CONFIRMATION",
  "MAKER_CHECKER_BULK_CONFIRMATION",
  "SESSION_AUTO_LOGOUT",
  "SESSION_TIMEOUT_MINUTES",
  "SESSION_WARNING_POPUP",
  "SESSION_WARNING_BEFORE_TIMEOUT_MINUTES",
  "ENABLE_PRODUCT_MAKER_CHECKER",
  "ENABLE_DIRECT_PUBLISH",
  "ENABLE_CATEGORY_APPROVAL",
  "ENABLE_INVENTORY_APPROVAL",
  "ENABLE_PRICE_APPROVAL",
  "ENABLE_IMAGE_APPROVAL",
  "ENABLE_DELETE_APPROVAL",
  "ENABLE_BULK_UPLOAD",
  "ENABLE_BULK_DELETE",
  "ENABLE_PRODUCT_VERSION_HISTORY",
  "ENABLE_PRODUCT_RESTORE",
  "ENABLE_PRODUCT_AUDIT",
  "DEFAULT_APPROVAL_MODE"
];

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PRODUCT_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const configurations = await prisma.configuration.findMany({
      where: {
        key: { in: CONFIG_KEYS }
      },
      orderBy: { key: "asc" }
    });

    return NextResponse.json(configurations);
  } catch (error) {
    console.error("[SETTINGS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PRODUCT_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    // Check if Product Admin has Settings permission
    const hasSettingsPermission = await prisma.superAdminPermission.findFirst({
      where: {
        userId: user.id,
        module: "Settings",
        status: "APPROVED"
      }
    });

    if (!hasSettingsPermission) {
      return NextResponse.json({
        error: "Security Violation: You do not have permission to modify System Configurations."
      }, { status: 403 });
    }

    const body = await request.json(); // key-value map

    const keysToUpdate = Object.keys(body).filter(k => CONFIG_KEYS.includes(k));

    for (const key of keysToUpdate) {
      const val = String(body[key]);

      await prisma.configuration.update({
        where: { key },
        data: { value: val }
      });

      if (key === "MAKER_CHECKER_CHECKER_ENABLED") {
        // Synchronize merchant checker configs
        await prisma.configuration.update({
          where: { key: "ENABLE_PRODUCT_MAKER_CHECKER" },
          data: { value: val }
        });
        await prisma.configuration.update({
          where: { key: "DEFAULT_APPROVAL_MODE" },
          data: { value: val === "true" ? "MAKER_CHECKER" : "DIRECT_PUBLISH" }
        });
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "UPDATE_CONFIG",
        module: "SETTINGS",
        status: "SUCCESS",
        details: `Updated configurations keys: ${keysToUpdate.join(", ")}`
      }
    });

    return NextResponse.json({ success: true, count: keysToUpdate.length });
  } catch (error) {
    console.error("[SETTINGS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
