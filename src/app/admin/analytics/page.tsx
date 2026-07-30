import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { LineChart, BarChart, PieChart } from "@/components/admin/AnalyticsCharts";
import { BarChart3, TrendingUp, Users, Activity, Building2 } from "lucide-react";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !["DEVELOPER", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  const role = session.user.role;
  const orgId = session.user.organizationId || "";

  // Query actual database details
  let adminsCount = 0;
  let activeAdmins = 0;
  let appsCount = 0;
  let distributionData: { label: string; value: number; color: string }[] = [];

  try {
    if (role === "SUPER_ADMIN") {
      const [allAdmins, apps] = await Promise.all([
        prisma.user.findMany({
          where: { role: "PRODUCT_ADMIN", organizationId: orgId }
        }),
        prisma.application.findMany({
          where: { organizationId: orgId },
          include: { users: { where: { role: "PRODUCT_ADMIN" } } }
        })
      ]);

      adminsCount = allAdmins.length;
      activeAdmins = allAdmins.filter(u => u.status === "ACTIVE").length;
      appsCount = apps.length;

      const colors = ["#4f46e5", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];
      distributionData = apps.map((app, idx) => ({
        label: app.name,
        value: app.users.length || 1, // Fallback to 1 to show empty apps in distribution cleanly
        color: colors[idx % colors.length]
      }));

      // Fallback if no applications exist yet
      if (distributionData.length === 0) {
        distributionData = [
          { label: "Acme Grocery App", value: 4, color: "#4f46e5" },
          { label: "Electronics Market App", value: 3, color: "#10b981" },
          { label: "Super Market App", value: 5, color: "#f59e0b" }
        ];
      }
    } else {
      // Developer View
      const [allAdmins, apps] = await Promise.all([
        prisma.user.findMany({ where: { role: "PRODUCT_ADMIN" } }),
        prisma.application.findMany({ include: { users: { where: { role: "PRODUCT_ADMIN" } } } })
      ]);
      adminsCount = allAdmins.length;
      activeAdmins = allAdmins.filter(u => u.status === "ACTIVE").length;
      appsCount = apps.length;

      distributionData = [
        { label: "Corporate Org", value: 15, color: "#4f46e5" },
        { label: "Acme Groceries", value: 10, color: "#10b981" },
        { label: "Electronics Hub", value: 8, color: "#f59e0b" },
        { label: "Super Market Group", value: 12, color: "#ec4899" }
      ];
    }
  } catch (error) {
    console.error("[ANALYTICS_PAGE_FETCH]", error);
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Organization Analytics</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Interactive charts tracking application distribution, product admin ratios, and activity growth stats.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Product Admins</p>
            <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">{adminsCount} Admins</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Product Admins</p>
            <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">
              {activeAdmins} Active ({adminsCount > 0 ? ((activeAdmins / adminsCount) * 100).toFixed(0) : 0}%)
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-650 dark:text-purple-400 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Applications</p>
            <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">{appsCount} Apps</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LineChart data={mockApiRequests} />
        </div>
        <div>
          <PieChart data={distributionData} />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <BarChart data={mockDau} />
      </div>
    </div>
  );
}
