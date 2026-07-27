import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FileText, Download, CheckCircle, Clock } from "lucide-react";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !["DEVELOPER", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  const reports = [
    { title: "Monthly Subscription Billing Report", type: "Billing", date: "July 2026", format: "CSV", size: "2.4 MB" },
    { title: "Active Licenses & Seats Audit Log", type: "Audit", date: "Q2 2026", format: "PDF", size: "1.8 MB" },
    { title: "SaaS API Usage Stats Summary", type: "API", date: "Daily", format: "JSON", size: "850 KB" },
    { title: "Active Session Security Event Report", type: "Security", date: "Weekly", format: "CSV", size: "1.2 MB" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Enterprise Reports</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Download system transaction sheets, compliance reports, and subscriber usage audits.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((rep, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-start justify-between gap-4 hover:shadow-md hover:border-slate-350 dark:hover:border-slate-700 transition-all group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded">
                  {rep.type}
                </span>
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-250 leading-snug pt-1">{rep.title}</h4>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Generated: {rep.date} • {rep.size}
                </p>
              </div>
            </div>
            <button className="p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-600 hover:text-white rounded-2xl border text-slate-600 dark:text-slate-400 dark:border-slate-700 flex items-center justify-center transition-all group-hover:scale-105 active:scale-95 shadow-sm">
              <Download className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
