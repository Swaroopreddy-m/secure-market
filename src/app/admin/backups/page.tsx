import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { History, Download, HardDrive, CheckCircle2, RefreshCw } from "lucide-react";
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";

export default async function BackupsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DEVELOPER") {
    redirect("/");
  }

  let backups: any[] = [];
  try {
    const backupPath = path.resolve(process.cwd(), "prisma/dev.db.bak");
    if (fs.existsSync(backupPath)) {
      const stats = fs.statSync(backupPath);
      backups.push({
        filename: "dev.db.bak",
        size: (stats.size / 1024).toFixed(1) + " KB",
        createdAt: stats.mtime,
        status: "ACTIVE"
      });
    }
  } catch (e) {
    console.error(e);
  }

  async function runBackupAction() {
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
            action: "DATABASE_BACKUP_PAGE",
            module: "BACKUPS",
            status: "SUCCESS",
            details: "Manual SQLite backup created on Backups admin page."
          }
        });
      }
      revalidatePath("/admin/backups");
    } catch (e) {
      console.error("[BACKUP_ACTION_FAILED]", e);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">System Backups</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Restore and schedule system configurations and database backup checkpoints.</p>
        </div>
        <form action={runBackupAction}>
          <button 
            type="submit" 
            className="flex items-center gap-1.5 px-5 py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-650/20 active:scale-95 transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Create Snapshot Backup
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900/50">
                <th className="p-4 px-6">Backup Name</th>
                <th className="p-4 px-6">Checkpoint Date</th>
                <th className="p-4 px-6">Size</th>
                <th className="p-4 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-800/50 font-mono">
              {backups.map((bak, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="p-4 px-6 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 font-sans">
                    <HardDrive className="w-4 h-4 text-indigo-500" />
                    {bak.filename}
                  </td>
                  <td className="p-4 px-6 text-slate-400 dark:text-slate-500">
                    {new Date(bak.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4 px-6 font-semibold text-slate-700 dark:text-slate-300">
                    {bak.size}
                  </td>
                  <td className="p-4 px-6 text-right">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 flex items-center gap-1 w-fit ml-auto font-sans">
                      <CheckCircle2 className="w-3 h-3" /> {bak.status}
                    </span>
                  </td>
                </tr>
              ))}
              {backups.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 font-sans">No backups created yet. Click above to take a manual database checkpoint.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
