import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Terminal, Clock, ShieldCheck, Cpu } from "lucide-react";

export default async function ApiLogsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DEVELOPER") {
    redirect("/");
  }

  const logs = await prisma.auditLog.findMany({
    include: {
      user: true,
    },
    orderBy: { timestamp: "desc" },
    take: 40,
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">System & API Logs</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Real-time database audit logs, API requests, and authentication event streams.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 bg-slate-50 dark:bg-slate-900/50">
                <th className="p-4 px-6">Timestamp</th>
                <th className="p-4 px-6">User / Actor</th>
                <th className="p-4 px-6">Action Event</th>
                <th className="p-4 px-6">Module</th>
                <th className="p-4 px-6">Response / Detail</th>
                <th className="p-4 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-800/50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors font-mono">
                  <td className="p-4 px-6 text-slate-400 dark:text-slate-500 text-[10px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-4 px-6 font-bold text-slate-700 dark:text-slate-300">
                    {log.user?.name || "SYSTEM"}
                  </td>
                  <td className="p-4 px-6 text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">
                    {log.action}
                  </td>
                  <td className="p-4 px-6 text-slate-550 dark:text-slate-455 text-[10px]">
                    {log.module}
                  </td>
                  <td className="p-4 px-6 text-slate-500 dark:text-slate-400 font-sans text-xs leading-normal max-w-xs truncate" title={log.details || ""}>
                    {log.details || "N/A"}
                  </td>
                  <td className="p-4 px-6 text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      log.status === "SUCCESS"
                        ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">No system events logged yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
