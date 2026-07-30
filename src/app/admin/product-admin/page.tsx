"use client";

import { useState, useEffect } from "react";
import { 
  Users, ShoppingBag, Sliders, ListOrdered, FileSpreadsheet, Bell, 
  Settings, CheckSquare, ShieldAlert, FileText, AlertCircle, Loader2, Sparkles, Building2, UserCheck
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  name: string;
  logo: string;
  description: string;
  theme: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  statistics: {
    totalMerchantUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    pendingUsers: number;
    pendingRoleConfirmations: number;
    productsCount: number;
    inventoryCount: number;
    ordersCount: number;
    categoriesCount: number;
  };
}

interface AuditLogRecord {
  id: string;
  timestamp: string;
  action: string;
  module: string;
  status: string;
  details: string;
}

interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function ProductAdminDashboard() {
  const [appData, setAppData] = useState<DashboardData | null>(null);
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [appRes, logsRes, notifRes] = await Promise.all([
          fetch("/api/product-admin/application"),
          fetch("/api/product-admin/audit-logs"),
          fetch("/api/product-admin/notifications")
        ]);

        if (!appRes.ok) throw new Error("Failed to load application data");
        
        const appJSON = await appRes.json();
        const logsJSON = await logsRes.json();
        const notifJSON = await notifRes.json();

        setAppData(appJSON);
        setLogs(logsJSON.slice(0, 5)); // show recent 5
        setNotifications(notifJSON.slice(0, 5)); // show recent 5
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-6">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-2xl w-1/4" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || !appData) {
    return (
      <div className="p-6 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Failed to Load Dashboard</h3>
        <p className="text-xs font-semibold text-slate-500">{error || "Ensure you are logged in as a Product Admin."}</p>
      </div>
    );
  }

  const stats = appData.statistics;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 p-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
            {appData.logo ? (
              <img src={appData.logo} alt={appData.name} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-8 h-8 text-indigo-400" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">{appData.name}</h2>
            <p className="text-xs font-medium text-slate-400 mt-1 max-w-xl">{appData.description || "No description provided for this application."}</p>
          </div>
        </div>

        <div className="flex-shrink-0 relative z-10 flex gap-3">
          <Link href="/admin/product-admin/profile" className="px-5 py-3 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl text-xs font-bold transition-all shadow-md">
            View App Profile
          </Link>
        </div>
      </div>

      {/* Statistics Widgets Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Application Statistics</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4 hover:border-indigo-500/30 transition-all">
            <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Users</p>
              <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">{stats.totalMerchantUsers}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4 hover:border-emerald-500/30 transition-all">
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Users</p>
              <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">{stats.activeUsers}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4 hover:border-amber-500/30 transition-all">
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-650 dark:text-amber-400">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Approvals</p>
              <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">{stats.pendingUsers}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4 hover:border-rose-500/30 transition-all">
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-650 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Matrix</p>
              <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">{stats.pendingRoleConfirmations}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4 hover:border-indigo-500/30 transition-all">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Products Offerings</p>
              <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">{stats.productsCount}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4 hover:border-indigo-500/30 transition-all">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock Sum</p>
              <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">{stats.inventoryCount}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4 hover:border-indigo-500/30 transition-all">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <ListOrdered className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Orders Count</p>
              <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">{stats.ordersCount}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4 hover:border-indigo-500/30 transition-all">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categories Count</p>
              <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">{stats.categoriesCount}</p>
            </div>
          </div>

        </div>
      </div>

      {/* Logs & Notifications Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Today's Activities / Audit Logs */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-500" /> Recent Activities
            </h3>
            <Link href="/admin/product-admin/audit-logs" className="text-[10px] font-bold text-indigo-650 hover:underline">
              View All Logs
            </Link>
          </div>
          
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{log.action.replace(/_/g, " ")}</p>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{log.details}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      log.status === "SUCCESS" ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400" : "bg-rose-50 text-rose-750 dark:bg-rose-950/20 dark:text-rose-450"
                    }`}>
                      {log.status}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6 font-semibold">No recent activities recorded.</p>
            )}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-500" /> Recent Notifications
            </h3>
            <Link href="/admin/product-admin/notifications" className="text-[10px] font-bold text-indigo-650 hover:underline">
              Inbox
            </Link>
          </div>
          
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div key={n.id} className="py-3 flex flex-col md:flex-row md:items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />}
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{n.title}</p>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{n.message}</p>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono flex-shrink-0">
                    {new Date(n.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6 font-semibold">No recent notifications.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
