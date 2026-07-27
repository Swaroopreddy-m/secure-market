import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Database, HardDrive, ShieldCheck, RefreshCw, Layers } from "lucide-react";
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";

export default async function DatabasePage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DEVELOPER") {
    redirect("/");
  }

  // Calculate file sizes
  let dbSize = "0 KB";
  let hasBackup = false;
  let backupSize = "0 KB";
  try {
    const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      dbSize = (stats.size / 1024).toFixed(1) + " KB";
    }
    const backupPath = path.resolve(process.cwd(), "prisma/dev.db.bak");
    if (fs.existsSync(backupPath)) {
      hasBackup = true;
      const stats = fs.statSync(backupPath);
      backupSize = (stats.size / 1024).toFixed(1) + " KB";
    }
  } catch (e) {
    console.error(e);
  }

  // DB Row Stats
  const [usersCount, logsCount, customersCount, productsCount] = await Promise.all([
    prisma.user.count(),
    prisma.auditLog.count(),
    prisma.customer.count(),
    prisma.product.count()
  ]);

  async function triggerBackupAction() {
    "use server";
    try {
      const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
      const backupPath = path.resolve(process.cwd(), "prisma/dev.db.bak");
      
      fs.copyFileSync(dbPath, backupPath);

      const devSession = await getServerSession(authOptions);
      if (devSession?.user) {
        await prisma.auditLog.create({
          data: {
            userId: devSession.user.id,
            action: "DATABASE_BACKUP",
            module: "DATABASE",
            status: "SUCCESS",
            details: `Manual SQLite database backup copied to prisma/dev.db.bak (${dbSize})`
          }
        });
      }
      
      revalidatePath("/admin/database");
    } catch (e) {
      console.error("[BACKUP_ACTION_FAILED]", e);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Prisma SQLite Operations</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Inspect database structures, monitor table storage, and trigger manual backups.</p>
        </div>
        <form action={triggerBackupAction}>
          <button 
            type="submit" 
            className="flex items-center gap-1.5 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <Database className="w-4 h-4" /> Trigger Database Backup
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* DB file size */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl flex-shrink-0">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Database Size</p>
            <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">{dbSize}</p>
          </div>
        </div>

        {/* Audit Log size */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Security Logs</p>
            <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">{logsCount} Rows</p>
          </div>
        </div>

        {/* Backup Status */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl flex-shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Backup Size (.bak)</p>
            <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">
              {hasBackup ? backupSize : "No Backup Configured"}
            </p>
          </div>
        </div>
      </div>

      {/* Database Schema Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/50">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Table Schema Statistics</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
          <div className="p-4 px-6 flex justify-between text-xs font-bold text-slate-655 dark:text-slate-400">
            <span>User Accounts</span>
            <span className="text-slate-850 dark:text-slate-200">{usersCount} Rows</span>
          </div>
          <div className="p-4 px-6 flex justify-between text-xs font-bold text-slate-655 dark:text-slate-400">
            <span>SaaS Customers (Tenants)</span>
            <span className="text-slate-850 dark:text-slate-200">{customersCount} Rows</span>
          </div>
          <div className="p-4 px-6 flex justify-between text-xs font-bold text-slate-655 dark:text-slate-400">
            <span>SaaS Product Offerings</span>
            <span className="text-slate-850 dark:text-slate-200">{productsCount} Rows</span>
          </div>
          <div className="p-4 px-6 flex justify-between text-xs font-bold text-slate-655 dark:text-slate-400">
            <span>Security & Audit Trails</span>
            <span className="text-slate-850 dark:text-slate-200">{logsCount} Rows</span>
          </div>
        </div>
      </div>
    </div>
  );
}
