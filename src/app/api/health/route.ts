import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import os from "os";

export async function GET() {
  try {
    // 1. Test database connection
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - startTime;

    // 2. Gather system info
    const sysUptime = os.uptime();
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const usedMem = totalMem - freeMem;
    const memoryPercentage = ((usedMem / totalMem) * 100).toFixed(1) + "%";

    return NextResponse.json({
      status: "UP",
      database: {
        status: "HEALTHY",
        latency: `${dbLatency}ms`
      },
      system: {
        uptime: `${(sysUptime / 3600).toFixed(2)} hours`,
        memoryUsage: {
          used: `${(usedMem / (1024 * 1024 * 1024)).toFixed(2)} GB`,
          total: `${(totalMem / (1024 * 1024 * 1024)).toFixed(2)} GB`,
          percentage: memoryPercentage
        },
        cpuLoad: os.loadavg()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("[HEALTH_CHECK_ERROR]", error);
    return NextResponse.json({
      status: "DOWN",
      error: error instanceof Error ? error.message : "Database connection failed",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
