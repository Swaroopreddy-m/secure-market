import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Bell, Info, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !["DEVELOPER", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  const notifications = await prisma.notification.findMany({
    include: {
      user: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">System Notifications</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">View critical system errors, warning alerts, and operation events.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/50">
        {notifications.map((n) => (
          <div key={n.id} className="p-6 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{n.title}</h4>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(n.createdAt).toLocaleDateString(undefined, { dateStyle: "short" })}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">{n.message}</p>
              <div className="flex items-center gap-2 pt-2">
                <span className="text-[9px] font-black uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 px-2 py-0.5 rounded">
                  User ID: {n.userId}
                </span>
                {n.read ? (
                  <span className="text-[9px] font-black uppercase bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded">
                    Read
                  </span>
                ) : (
                  <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 px-2 py-0.5 rounded animate-pulse">
                    New Alert
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            <Bell className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-sm font-bold">No new system alerts.</p>
            <p className="text-xs text-slate-500">Everything is running smoothly.</p>
          </div>
        )}
      </div>
    </div>
  );
}
