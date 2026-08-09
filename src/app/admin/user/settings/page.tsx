"use client";

import { useSession } from "next-auth/react";
import { User, ShieldCheck, Mail, ShieldAlert, Cpu } from "lucide-react";

export default function MerchantSettingsPage() {
  const { data: session } = useSession();

  if (!session) return null;

  const user = session.user as any;
  const permissions = user.department ? user.department.split(",") : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 p-6">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Merchant Workspace Profile</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Verify your assigned permissions matrix and organization scope metadata.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm space-y-4 md:col-span-1">
          <div className="flex flex-col items-center justify-center space-y-3 py-4 text-center">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/40 rounded-full flex items-center justify-center text-indigo-650 dark:text-indigo-400">
              <User className="w-10 h-10" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{user.name}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.designation || "Merchant Staff"}</p>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t text-xs font-semibold text-slate-655 dark:text-slate-350">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Employee ID</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{user.employeeId || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Username</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{user.username || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Email Address</span>
              <span className="text-slate-850 dark:text-slate-200">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Permissions Scope Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm space-y-4 md:col-span-2">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4.5 h-4.5 text-indigo-650" /> Assigned Module Permissions
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            You are authorized to execute Maker tasks only for modules listed below. Any operations outside this matrix are blocked.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {permissions.length > 0 ? (
              permissions.map((perm: string) => (
                <span key={perm} className="px-3.5 py-1.5 bg-slate-50 border dark:bg-slate-955/40 dark:border-slate-850 rounded-2xl text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {perm.trim()}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">No explicit modules assigned.</span>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
