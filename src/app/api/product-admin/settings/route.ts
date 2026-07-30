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
  "SESSION_WARNING_BEFORE_TIMEOUT_MINUTES"
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

    // Check if Product Admin has Settings permission
    const hasSettingsPermission = await prisma.superAdminPermission.findFirst({
      where: {
        userId: session.user.id,
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
      
      // Perform validation bounds on session timeouts
      if (key === "SESSION_TIMEOUT_MINUTES") {
        const minVal = parseInt(val);
        if (isNaN(minVal) || minVal < 5 || minVal > 120) {
          return NextResponse.json({ error: "Session timeout must be between 5 and 120 minutes." }, { status: 400 });
        }
      }

      await prisma.configuration.update({
        where: { key },
        data: { value: val }
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
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
