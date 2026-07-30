"use client";

import { useState, useEffect } from "react";
import { 
  FileSpreadsheet, Search, RefreshCw, Calendar, Loader2, AlertCircle, Laptop, ShieldCheck
} from "lucide-react";

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  module: string;
  status: string;
  ip: string;
  browser: string;
  device: string;
  details: string;
  user: {
    name: string;
    email: string;
    username: string;
    role: string;
  } | null;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [moduleFilter, setModuleFilter] = useState("ALL");

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/product-admin/audit-logs");
      if (!res.ok) throw new Error("Failed to fetch historical audit logs.");
      const data = await res.json();
      setLogs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getModules = () => {
    const mods = new Set(logs.map(l => l.module).filter(Boolean));
    return ["ALL", ...Array.from(mods)];
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      (log.user && log.user.username.toLowerCase().includes(search.toLowerCase())) ||
      (log.user && log.user.name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || log.status === statusFilter;
    const matchesModule = moduleFilter === "ALL" || log.module === moduleFilter;

    return matchesSearch && matchesStatus && matchesModule;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 p-6">
      
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">System Audit History</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Immutable operation log entries. Captures timestamps, client parameters, and status codes.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="p-3 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 hover:bg-slate-100 rounded-2xl cursor-pointer"
          title="Refresh Log Stream"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-750 p-4 rounded-2xl text-xs font-bold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters Card */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search action, details, user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 focus:outline-none text-xs font-bold text-slate-750 dark:text-slate-250"
          />
        </div>

        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-4 focus:outline-none text-xs font-bold text-slate-800 dark:text-slate-100"
          >
            <option value="ALL">All Outcomes</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        <div className="w-full md:w-48">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="w-full bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-4 focus:outline-none text-xs font-bold text-slate-800 dark:text-slate-100"
          >
            {getModules().map(m => (
              <option key={m} value={m}>
                {m === "ALL" ? "All Modules" : m}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto font-sans">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/40 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Operator</th>
                <th className="p-4">Action Event</th>
                <th className="p-4">Module</th>
                <th className="p-4">Outcome</th>
                <th className="p-4">Client IP / Browser</th>
                <th className="p-4">Action Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-semibold text-slate-655 dark:text-slate-350">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-650" />
                    Loading system event logs...
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="p-4 text-slate-400 font-mono text-[10px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4">
                      {log.user ? (
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-100">{log.user.username}</div>
                          <div className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">{log.user.role}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">System Event</span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                      {log.action.replace(/_/g, " ")}
                    </td>
                    <td className="p-4 font-mono text-[10px] text-slate-400">{log.module}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        log.status === "SUCCESS" ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400" : "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-mono text-[10px]">{log.ip}</div>
                      <div className="text-[9px] text-slate-400 truncate max-w-[130px]" title={log.browser}>
                        {log.browser}
                      </div>
                    </td>
                    <td className="p-4 text-[11px] font-medium max-w-sm whitespace-normal break-words leading-relaxed text-slate-500">
                      {log.details}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                    No matching audit records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
