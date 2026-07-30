import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const keys = [
      "SESSION_AUTO_LOGOUT",
      "SESSION_TIMEOUT_MINUTES",
      "SESSION_WARNING_POPUP",
      "SESSION_WARNING_BEFORE_TIMEOUT_MINUTES",
      "MAKER_CHECKER_CHECKER_ENABLED",
      "MAKER_CHECKER_MAKER_ENABLED",
      "MAKER_CHECKER_DUAL_APPROVAL"
    ];

    const configs = await prisma.configuration.findMany({
      where: { key: { in: keys } }
    });

    const configMap: Record<string, string> = {};
    configs.forEach(c => {
      configMap[c.key] = c.value;
    });

    return NextResponse.json({
      autoLogout: configMap["SESSION_AUTO_LOGOUT"] || "true",
      timeoutMinutes: configMap["SESSION_TIMEOUT_MINUTES"] || "15",
      warningPopup: configMap["SESSION_WARNING_POPUP"] || "true",
      warningMinutes: configMap["SESSION_WARNING_BEFORE_TIMEOUT_MINUTES"] || "1",
      checkerEnabled: configMap["MAKER_CHECKER_CHECKER_ENABLED"] || "true",
      makerEnabled: configMap["MAKER_CHECKER_MAKER_ENABLED"] || "true",
      dualApproval: configMap["MAKER_CHECKER_DUAL_APPROVAL"] || "true"
    });
  } catch (error) {
    console.error("[SESSION_CONFIG_GET]", error);
    // Return safe default values in case of DB locks
    return NextResponse.json({
      autoLogout: "true",
      timeoutMinutes: "15",
      warningPopup: "true",
      warningMinutes: "1",
      checkerEnabled: "true",
      makerEnabled: "true",
      dualApproval: "true"
    });
  }
}
export const dynamic = "force-dynamic";
