import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FileSpreadsheet, Search, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";

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
            module: {
              in: ["DASHBOARD", "PRODUCTS", "CUSTOMERS", "USERS", "AUDIT", "AUTH"]
            }
          },
      include: { user: true },
      orderBy: { timestamp: "desc" }
    });
  } catch (error) {
    console.error("[AUDIT_LOGS_FETCH]", error);
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Security Audit Trail</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {isDeveloper 
            ? "Complete system-level trace logs including configurations, backups, and deployments." 
            : "Business operation audit logs (customer accounts, user management, and product edits)."}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-5">Timestamp</th>
                <th className="px-6 py-5">User</th>
                <th className="px-6 py-5">Action</th>
                <th className="px-6 py-5">Module</th>
                <th className="px-6 py-5">Details</th>
                <th className="px-6 py-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-850">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4 font-mono text-[10px] text-slate-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-700 dark:text-slate-300">
                      {log.user?.name || "System"}
                    </div>
                    <div className="text-[9px] text-slate-400 truncate max-w-[120px]">
                      {log.user?.email || "system@local"}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                    {log.action}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] font-black uppercase text-slate-600 dark:text-slate-400">
                      {log.module}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-sm truncate" title={log.details || ""}>
                    {log.details || "No details provided."}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase inline-flex items-center gap-1 ${
                      log.status === "SUCCESS" 
                        ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400" 
                        : "bg-rose-50 text-rose-700 dark:bg-rose-955/30 dark:text-rose-400"
                    }`}>
                      {log.status === "SUCCESS" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                    No security log entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
