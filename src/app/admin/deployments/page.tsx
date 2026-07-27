import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Cpu, Server, Activity, Terminal, Play, RotateCw, CheckCircle2 } from "lucide-react";

export default async function DeploymentsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DEVELOPER") {
    redirect("/");
  }

  const nodes = [
    { name: "Render Web Node A (Primary)", region: "Singapore (SIN-1)", ip: "10.56.152.128", status: "HEALTHY", cpu: "1.2%", memory: "128MB / 512MB" },
    { name: "Render Web Node B (Secondary)", region: "Singapore (SIN-1)", ip: "10.56.152.129", status: "HEALTHY", cpu: "0.8%", memory: "115MB / 512MB" }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Active Deployments & Cluster</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Monitor active server nodes, cluster health, CPU utilization, and region maps.</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-600/10">
          <RotateCw className="w-4 h-4" /> Trigger Redeploy
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {nodes.map((node, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-500" /> {node.name}
              </h3>
              <span className="px-2 py-0.5 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 rounded-full text-[9px] font-black uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {node.status}
              </span>
            </div>

            <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/50 pt-4 text-xs font-bold text-slate-655 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Region</span>
                <span className="text-slate-800 dark:text-slate-300">{node.region}</span>
              </div>
              <div className="flex justify-between">
                <span>Host IP</span>
                <span className="text-slate-850 dark:text-slate-300 font-mono text-[10px]">{node.ip}</span>
              </div>
              <div className="flex justify-between">
                <span>CPU load</span>
                <span className="text-slate-800 dark:text-slate-300">{node.cpu}</span>
              </div>
              <div className="flex justify-between">
                <span>RAM allocation</span>
                <span className="text-slate-800 dark:text-slate-300">{node.memory}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Live Console Output</h3>
        <div className="bg-slate-950 text-slate-350 p-5 rounded-2xl font-mono text-[10px] leading-relaxed space-y-1 overflow-x-auto shadow-inner border border-slate-800">
          <p className="text-indigo-400">[2026-07-27 23:41:04] info: prisma client generated successfully.</p>
          <p className="text-green-400">[2026-07-27 23:41:18] info: database seed completed successfully.</p>
          <p>[2026-07-27 23:45:25] info: initialized BroadcastChannel tab coordinator.</p>
          <p>[2026-07-27 23:47:55] info: loaded active session verification middleware.</p>
          <p className="text-slate-500 animate-pulse">[2026-07-27 23:48:07] waiting for connections on port 3000...</p>
        </div>
      </div>
    </div>
  );
}
