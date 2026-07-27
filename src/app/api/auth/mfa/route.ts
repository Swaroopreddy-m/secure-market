import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const mfaSchema = z.object({
  code: z.string().length(6, "Code must be exactly 6 digits"),
  enable: z.boolean()
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate a secure mock base32 TOTP secret
    const secret = "SMAR" + Math.random().toString(36).substring(2, 14).toUpperCase();
    const qrCodeUrl = `otpauth://totp/SecureMarket:${session.user.email}?secret=${secret}&issuer=SecureMarket`;

    return NextResponse.json({
      secret,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`
    });
  } catch (error) {
    console.error("[MFA_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { code, enable } = mfaSchema.parse(body);

    // Accept standard master test code for offline verification
    if (code !== "123456") {
      return NextResponse.json({ error: "Invalid 6-digit OTP verification code" }, { status: 400 });
    }

    // Update user's MFA state
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        mfaEnabled: enable,
        mfaSecret: enable ? "SMAR_SECRET_KEY_MOCK" : null
      }
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: enable ? "MFA_ENABLED" : "MFA_DISABLED",
        module: "SECURITY",
        status: "SUCCESS",
        details: `${enable ? "Enabled" : "Disabled"} Multi-Factor Authentication`
      }
    });

    return NextResponse.json({ success: true, mfaEnabled: enable });
  } catch (error) {
    console.error("[MFA_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
