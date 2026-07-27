import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Activity, Cpu, HardDrive, Settings, HelpCircle, Thermometer } from "lucide-react";
import os from "os";

function formatBytes(bytes: number, decimals = 2) {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export default async function MonitoringPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DEVELOPER") {
    redirect("/");
  }

  // Real Node.js process / OS metrics
  const memory = process.memoryUsage();
  const heapUsed = formatBytes(memory.heapUsed);
  const heapTotal = formatBytes(memory.heapTotal);
  const rss = formatBytes(memory.rss);
  const external = formatBytes(memory.external);

  const totalMem = formatBytes(os.totalmem());
  const freeMem = formatBytes(os.freemem());
  const cpus = os.cpus();
  const uptime = Math.floor(os.uptime());
  
  const days = Math.floor(uptime / (3600*24));
  const hours = Math.floor((uptime % (3600*24)) / 3600);
  const mins = Math.floor((uptime % 3600) / 60);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">System Monitoring</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">View real-time hardware status, CPU architecture load, memory heaps, and server process details.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Node process memory card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" /> Node.js Heap Statistics
          </h3>
          <div className="space-y-2 text-xs divide-y dark:divide-slate-800 font-mono">
            <div className="py-2 flex justify-between">
              <span className="font-sans font-bold text-slate-500">Heap Used</span>
              <span className="font-black text-slate-700 dark:text-slate-300">{heapUsed}</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="font-sans font-bold text-slate-500">Heap Total</span>
              <span className="font-black text-slate-700 dark:text-slate-300">{heapTotal}</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="font-sans font-bold text-slate-500">RSS (Resident Set Size)</span>
              <span className="font-black text-slate-700 dark:text-slate-300">{rss}</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="font-sans font-bold text-slate-500">External Allocations</span>
              <span className="font-black text-slate-700 dark:text-slate-300">{external}</span>
            </div>
          </div>
        </div>

        {/* Server Hardware metrics card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-500" /> Operating System Resources
          </h3>
          <div className="space-y-2 text-xs divide-y dark:divide-slate-800 font-mono">
            <div className="py-2 flex justify-between">
              <span className="font-sans font-bold text-slate-500">Platform / Architecture</span>
              <span className="font-black text-slate-700 dark:text-slate-300 uppercase">{os.platform()} ({os.arch()})</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="font-sans font-bold text-slate-500">Total System Memory</span>
              <span className="font-black text-slate-700 dark:text-slate-300">{totalMem}</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="font-sans font-bold text-slate-500">Free System Memory</span>
              <span className="font-black text-slate-700 dark:text-slate-300">{freeMem}</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="font-sans font-bold text-slate-500">Server Uptime</span>
              <span className="font-black text-slate-700 dark:text-slate-300 font-sans">{days}d {hours}h {mins}m</span>
            </div>
          </div>
        </div>
      </div>

      {/* CPU Cores listing */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-indigo-500" /> Processor Cores Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cpus.slice(0, 4).map((cpu, index) => (
            <div key={index} className="p-3.5 bg-slate-50 dark:bg-slate-800/30 rounded-2xl flex flex-col gap-1 border border-slate-100 dark:border-slate-800 font-mono text-[11px]">
              <span className="font-sans font-bold text-slate-700 dark:text-slate-300">Core #{index + 1}: {cpu.model}</span>
              <span className="text-slate-400">Speed: {(cpu.speed / 1000).toFixed(2)} GHz</span>
            </div>
          ))}
          {cpus.length > 4 && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/30 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800 text-[11px] font-sans font-bold text-slate-500">
              + {cpus.length - 4} More CPU Cores
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
