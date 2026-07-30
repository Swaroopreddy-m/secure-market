"use client";

import { useState, useEffect } from "react";
import { 
  FileText, Search, Download, Table, ListFilter, RefreshCw, Calendar, Loader2, AlertCircle
} from "lucide-react";

interface ReportUser {
  id: string;
  employeeId: string;
  username: string;
  name: string;
  email: string;
  mobile: string;
  department: string;
  designation: string;
  status: string;
  userApprovalStatus: string;
  roleMatrixStatus: string;
  makerUsername: string;
  createdAt: string;
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/product-admin/merchant-users");
      if (!res.ok) throw new Error("Failed to load reports dataset.");
      const dataset = await res.json();
      setData(dataset);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getDepartments = () => {
    const depts = new Set(data.map(u => u.department).filter(Boolean));
    return ["ALL", ...Array.from(depts)];
  };

  // Filter & Sort
  const processedData = data.filter(u => {
    const matchesSearch = 
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || 
      (statusFilter === "ACTIVE" && u.status === "ACTIVE") ||
      (statusFilter === "PENDING" && u.userApprovalStatus === "PENDING") ||
      (statusFilter === "DRAFT" && u.userApprovalStatus === "DRAFT") ||
      (statusFilter === "REJECTED" && u.userApprovalStatus === "REJECTED") ||
      (statusFilter === "RETURNED" && u.userApprovalStatus === "RETURNED");

    const matchesDept = deptFilter === "ALL" || u.department === deptFilter;

    return matchesSearch && matchesStatus && matchesDept;
  }).sort((a, b) => {
    let comparison = 0;
    if (sortBy === "createdAt") {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === "username") {
      comparison = a.username.localeCompare(b.username);
    } else if (sortBy === "employeeId") {
      comparison = a.employeeId.localeCompare(b.employeeId);
    }
    return sortOrder === "desc" ? -comparison : comparison;
  });

  // Export CSV
  const handleExportCSV = () => {
    if (processedData.length === 0) return;
    
    const headers = [
      "Employee ID", "Username", "Full Name", "Email", "Mobile", 
      "Department", "Designation", "Approval Status", "Active Status", 
      "Roles Matrix Status", "Created By (Maker)", "Created At"
    ];

    const rows = processedData.map(u => [
      u.employeeId, u.username, u.name, u.email, u.mobile,
      u.department || "", u.designation || "", u.userApprovalStatus, u.status,
      u.roleMatrixStatus, u.makerUsername, new Date(u.createdAt).toISOString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `merchant_users_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 p-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Audit & Operations Reports</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Generate and export custom reports of your active, pending, or returned Merchant Users.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={processedData.length === 0}
          className="flex items-center justify-center gap-1.5 px-5 py-3 bg-indigo-650 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white rounded-2xl font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 dark:bg-rose-955/20 dark:border-rose-900/30 dark:text-rose-455 p-4 rounded-2xl text-xs font-bold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Advanced Filter Workspace */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        
        {/* Search */}
        <div className="space-y-1.5 col-span-1 lg:col-span-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Term</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-0 text-xs font-bold text-slate-750 dark:text-slate-250"
            />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approval Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-4 focus:outline-none text-xs font-bold text-slate-800 dark:text-slate-100"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Approved + Active</option>
            <option value="PENDING">Pending Checker</option>
            <option value="DRAFT">Draft</option>
            <option value="RETURNED">Returned</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Department */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</label>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-4 focus:outline-none text-xs font-bold text-slate-800 dark:text-slate-100"
          >
            {getDepartments().map(d => (
              <option key={d} value={d}>
                {d === "ALL" ? "All Departments" : d}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Field */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort Order</label>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 bg-slate-55 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-4 focus:outline-none text-xs font-bold text-slate-850 dark:text-slate-100"
            >
              <option value="createdAt">Date Created</option>
              <option value="username">Username</option>
              <option value="employeeId">Employee ID</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-slate-55 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-4 focus:outline-none text-xs font-bold text-slate-850 dark:text-slate-100"
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>

      </div>

      {/* Report Table Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/40 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850">
                <th className="p-4">Employee ID</th>
                <th className="p-4">Username / Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Department / Designation</th>
                <th className="p-4">Approval status</th>
                <th className="p-4">System status</th>
                <th className="p-4 font-mono text-[9px]">Maker</th>
                <th className="p-4">Date Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-855 text-xs font-semibold text-slate-655 dark:text-slate-350">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-650" />
                    Fetching report dataset...
                  </td>
                </tr>
              ) : processedData.length > 0 ? (
                processedData.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">{u.employeeId}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-850 dark:text-slate-100">{u.username}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{u.name}</div>
                    </td>
                    <td className="p-4">{u.email}</td>
                    <td className="p-4">
                      <div className="font-bold">{u.department || "-"}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{u.designation || "-"}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        u.userApprovalStatus === "APPROVED" ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400" :
                        u.userApprovalStatus === "PENDING" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400" :
                        u.userApprovalStatus === "REJECTED" ? "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400" :
                        "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      }`}>
                        {u.userApprovalStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        u.status === "ACTIVE" ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400" : "bg-slate-100 text-slate-500"
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[10px]">{u.makerUsername}</td>
                    <td className="p-4 text-slate-400 font-medium">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                    No matching report entries. Adjust filters to search.
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
