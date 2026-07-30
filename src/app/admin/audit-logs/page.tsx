import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AuditLogsClient from "@/components/admin/AuditLogsClient";

export default async function AuditLogsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !["DEVELOPER", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  const isDeveloper = session.user.role === "DEVELOPER";

  let logs: any[] = [];
  try {
    logs = await prisma.auditLog.findMany({
      where: isDeveloper 
        ? undefined 
        : {
            user: {
              organizationId: session.user.organizationId || ""
            }
          },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { timestamp: "desc" }
    });
  } catch (error) {
    console.error("[AUDIT_LOGS_FETCH]", error);
  }

  // Format timestamp for browser client components safely
  const formattedLogs = logs.map((log) => ({
    id: log.id,
    timestamp: log.timestamp.toISOString(),
    action: log.action,
    module: log.module,
    status: log.status,
    details: log.details,
    user: log.user
  }));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <AuditLogsClient 
        initialLogs={formattedLogs}
        isDeveloper={isDeveloper}
      />
    </div>
  );
}
