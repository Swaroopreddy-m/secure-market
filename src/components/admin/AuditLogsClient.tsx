"use client";

import { useState } from "react";
import { 
  Search, Filter, Download, ArrowUpDown, ChevronLeft, ChevronRight, 
  CheckCircle2, XCircle, FileSpreadsheet, ShieldAlert
} from "lucide-react";

interface AuditLogRecord {
  id: string;
  timestamp: string;
  action: string;
  module: string;
  status: string;
  details: string | null;
  user: {
    name: string | null;
    email: string | null;
  } | null;
}

interface AuditLogsClientProps {
  initialLogs: AuditLogRecord[];
  isDeveloper: boolean;
}

export default function AuditLogsClient({
  initialLogs,
  isDeveloper
}: AuditLogsClientProps) {
  const [logs, setLogs] = useState<AuditLogRecord[]>(initialLogs);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  
  // Sorting State
  const [sortField, setSortField] = useState<string>("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Extract unique modules for dropdown filter
  const modules = Array.from(new Set(logs.map(l => l.module))).sort();

  // Sorting Handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc"); // Default to newest/desc
    }
    setCurrentPage(1);
  };

  // Filter Logic
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.module.toLowerCase().includes(search.toLowerCase()) ||
      (log.details || "").toLowerCase().includes(search.toLowerCase()) ||
      (log.user?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (log.user?.email || "").toLowerCase().includes(search.toLowerCase());

    const matchesModule = moduleFilter === "All" || log.module === moduleFilter;
    const matchesStatus = statusFilter === "All" || log.status === statusFilter;

    return matchesSearch && matchesModule && matchesStatus;
  });

  // Sorting logic
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    let aVal: any = a[sortField as keyof AuditLogRecord];
    let bVal: any = b[sortField as keyof AuditLogRecord];

    if (aVal === null || aVal === undefined) aVal = "";
    if (bVal === null || bVal === undefined) bVal = "";

    if (sortField === "timestamp") {
      return sortOrder === "asc"
        ? new Date(aVal).getTime() - new Date(bVal).getTime()
        : new Date(bVal).getTime() - new Date(aVal).getTime();
    }

    if (typeof aVal === "string") {
      return sortOrder === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    return sortOrder === "asc"
      ? (aVal > bVal ? 1 : -1)
      : (bVal > aVal ? 1 : -1);
  });

  // Pagination
  const totalPages = Math.ceil(sortedLogs.length / itemsPerPage);
  const paginatedLogs = sortedLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // CSV Export
  const handleExportCSV = () => {
    const headers = ["Timestamp", "User Name", "User Email", "Action", "Module", "Details", "Status"];
    const rows = sortedLogs.map((log) => [
      new Date(log.timestamp).toISOString(),
      log.user?.name || "System",
      log.user?.email || "system@local",
      log.action,
      log.module,
      log.details || "",
      log.status
    ]);

    const csvContent = 
      "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map((r) => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `security_audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header and Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Security Audit Trail</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {isDeveloper 
              ? "Complete system-level trace logs including configurations, backups, and deployments." 
              : "Business operation audit logs (customer accounts, user management, and product edits)."}
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 shadow-sm cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export Spreadsheet
        </button>
      </div>

      {/* 2. Advanced Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, module, details or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-foreground"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          
          <select
            value={moduleFilter}
            onChange={(e) => { setModuleFilter(e.target.value); setCurrentPage(1); }}
            className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2 px-3 text-xs font-bold text-slate-655 dark:text-slate-350 focus:outline-none"
          >
            <option value="All">All Modules</option>
            {modules.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2 px-3 text-xs font-bold text-slate-655 dark:text-slate-350 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILURE">FAILURE</option>
          </select>
        </div>
      </div>

      {/* 3. Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden animate-in fade-in duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/50">
                <th className="p-4 px-6 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40" onClick={() => handleSort("timestamp")}>
                  <div className="flex items-center gap-1">
                    Timestamp <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="p-4 px-6">User</th>
                <th className="p-4 px-6 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40" onClick={() => handleSort("action")}>
                  <div className="flex items-center gap-1">
                    Action <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="p-4 px-6 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40" onClick={() => handleSort("module")}>
                  <div className="flex items-center gap-1">
                    Module <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="p-4 px-6">Details</th>
                <th className="p-4 px-6 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40" onClick={() => handleSort("status")}>
                  <div className="flex items-center gap-1 justify-end">
                    Status <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-850">
              {paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                  <td className="px-6 py-4 font-mono text-[10px] text-slate-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-extrabold text-slate-800 dark:text-slate-200">
                      {log.user?.name || "System"}
                    </div>
                    <div className="text-[9px] text-slate-450 truncate max-w-[150px]">
                      {log.user?.email || "system@local"}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-[10px] text-indigo-650 font-bold">
                    {log.action}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] font-black uppercase text-slate-600 dark:text-slate-350">
                      {log.module}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-450 font-medium leading-relaxed max-w-sm truncate" title={log.details || ""}>
                    {log.details || "No details logged."}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase inline-flex items-center gap-1 ${
                      log.status === "SUCCESS" 
                        ? "bg-green-50 text-green-700 dark:bg-green-955/30 dark:text-green-400 border border-green-200/20" 
                        : "bg-rose-50 text-rose-700 dark:bg-rose-955/20 dark:text-rose-450 border border-rose-200/20"
                    }`}>
                      {log.status === "SUCCESS" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {sortedLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold">No security audit trail matches filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-1.5 border dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl disabled:opacity-50 text-slate-655 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-1.5 border dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl disabled:opacity-50 text-slate-655 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
