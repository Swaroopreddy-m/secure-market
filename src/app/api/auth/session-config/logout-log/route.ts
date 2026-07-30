import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ success: true, message: "No active session to log out" });
    }

    const { searchParams } = new URL(request.url);
    const isManual = searchParams.get("manual") === "true";

    const action = isManual ? "MANUAL_LOGOUT" : "SESSION_TIMEOUT";
    const details = isManual
      ? `User ${session.user.name || session.user.id} logged out manually.`
      : `Session expired due to inactivity for user ${session.user.name || session.user.id}.`;

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action,
        module: "AUTH",
        status: "SUCCESS",
        details
      }
    });

    // Invalidate concurrent session record in DB if active session exists
    if (session.sessionId) {
      await prisma.activeSession.deleteMany({
        where: { sessionId: session.sessionId }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LOGOUT_LOG_ERROR]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
