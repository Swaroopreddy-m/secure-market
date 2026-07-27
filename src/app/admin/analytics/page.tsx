import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LineChart, BarChart, PieChart } from "@/components/admin/AnalyticsCharts";
import { BarChart3, TrendingUp, Users, Activity } from "lucide-react";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DEVELOPER") {
    redirect("/");
  }

  const mockApiRequests = [
    { label: "Mon", value: 1200 },
    { label: "Tue", value: 1900 },
    { label: "Wed", value: 1500 },
    { label: "Thu", value: 2100 },
    { label: "Fri", value: 2800 },
    { label: "Sat", value: 2400 },
    { label: "Sun", value: 3100 }
  ];

  const mockDau = [
    { label: "Mon", value: 140 },
    { label: "Tue", value: 185 },
    { label: "Wed", value: 200 },
    { label: "Thu", value: 210 },
    { label: "Fri", value: 250 },
    { label: "Sat", value: 190 },
    { label: "Sun", value: 290 }
  ];

  const mockCustomerDistribution = [
    { label: "School", value: 15, color: "#4f46e5" },
    { label: "Company", value: 10, color: "#10b981" },
    { label: "Bank", value: 8, color: "#f59e0b" },
    { label: "Retail", value: 12, color: "#ec4899" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">System Analytics</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Interactive charts tracking daily active users, transaction patterns, and load times.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peak Concurrent Users</p>
            <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">340 Users</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Growth</p>
            <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">+14.2%</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-650 dark:text-purple-400 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Average Latency</p>
            <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">42 ms</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LineChart data={mockApiRequests} />
        </div>
        <div>
          <PieChart data={mockCustomerDistribution} />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <BarChart data={mockDau} />
      </div>
    </div>
  );
}
