"use client";

import { useState } from "react";
import { 
  Download, Search, Filter, ArrowUpDown, Shield, 
  ChevronLeft, ChevronRight, FileSpreadsheet, Building2, UserCheck
} from "lucide-react";

interface AdminReportRecord {
  id: string;
  employeeId: string;
  username: string;
  name: string;
  email: string;
  status: string;
  userApprovalStatus: string;
  roleMatrixStatus: string;
  department: string;
  designation: string;
  createdAt: string;
  applicationName: string;
  organizationName: string;
}

interface AppReportRecord {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  status: string;
  productAdminsCount: number;
}

interface ReportsClientProps {
  initialAdmins: AdminReportRecord[];
  initialApps: AppReportRecord[];
  orgName: string;
}

export default function ReportsClient({
  initialAdmins,
  initialApps,
  orgName
}: ReportsClientProps) {
  const [activeTab, setActiveTab] = useState<"ADMINS" | "APPS">("ADMINS");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Pagination & Sorting States
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("username");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const itemsPerPage = 8;

  // Sorting Handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  // Filter & Search Logic
  const filteredAdmins = initialAdmins.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      u.designation.toLowerCase().includes(search.toLowerCase()) ||
      u.applicationName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "All" || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredApps = initialApps.filter((app) => {
    const matchesSearch = 
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.description.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const sortedAdmins = [...filteredAdmins].sort((a, b) => {
    const aVal = String(a[sortField as keyof AdminReportRecord] || "");
    const bVal = String(b[sortField as keyof AdminReportRecord] || "");
    return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });

  const sortedApps = [...filteredApps].sort((a, b) => {
    const aVal = a.name;
    const bVal = b.name;
    return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });

  // Pagination Slice
  const totalPages = Math.ceil(
    (activeTab === "ADMINS" ? sortedAdmins.length : sortedApps.length) / itemsPerPage
  );

  const paginatedAdmins = sortedAdmins.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const paginatedApps = sortedApps.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // CSV Export Handler
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    const fileName = activeTab === "ADMINS" ? "product_admins_report" : "applications_report";

    if (activeTab === "ADMINS") {
      headers = [
        "Employee ID", "Username", "Full Name", "Email", "Application",
        "Designation", "Rights/Matrix", "User Approval", "Role Matrix Approval", "Status", "Created Date"
      ];
      rows = filteredAdmins.map(u => [
        u.employeeId, u.username, u.name, u.email, u.applicationName,
        u.designation, u.department, u.userApprovalStatus, u.roleMatrixStatus, u.status, new Date(u.createdAt).toLocaleDateString()
      ]);
    } else {
      headers = ["Application Name", "Description", "Product Admins Count", "Created Date"];
      rows = filteredApps.map(app => [
        app.name, app.description, String(app.productAdminsCount), new Date(app.createdAt).toLocaleDateString()
      ]);
    }

    const csvContent = 
      "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${fileName}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-200/50";
      case "PENDING":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50";
      case "LOCKED":
      case "INACTIVE":
        return "bg-rose-50 text-rose-700 dark:bg-rose-955/20 dark:text-rose-450 border border-rose-200/50";
      default:
        return "bg-slate-50 text-slate-600 border border-slate-200/50";
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Organization Reports</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Export and analyze Product Admin listings and active Applications for <strong className="text-slate-800 dark:text-slate-200">{orgName}</strong>.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 rounded-2xl text-xs font-bold text-slate-655 dark:text-slate-400 shadow-sm transition-all hover:scale-102 active:scale-98 cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export Report CSV
        </button>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => { setActiveTab("ADMINS"); setSearch(""); setStatusFilter("All"); setCurrentPage(1); }}
          className={`pb-3 text-sm font-extrabold transition-all border-b-2 px-1 cursor-pointer flex items-center gap-2 ${
            activeTab === "ADMINS" 
              ? "border-indigo-650 text-indigo-650" 
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          <UserCheck className="w-4 h-4" /> Product Admins Report
        </button>
        <button
          onClick={() => { setActiveTab("APPS"); setSearch(""); setCurrentPage(1); }}
          className={`pb-3 text-sm font-extrabold transition-all border-b-2 px-1 cursor-pointer flex items-center gap-2 ${
            activeTab === "APPS" 
              ? "border-indigo-650 text-indigo-650" 
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          <Building2 className="w-4 h-4" /> Applications Report
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === "ADMINS" ? "Search Product Admins by name, username, employee ID, designation..." : "Search Applications by name or description..."}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-foreground"
          />
        </div>

        {activeTab === "ADMINS" && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-2 px-3 text-xs font-bold text-slate-655 dark:text-slate-300 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="PENDING">PENDING</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="LOCKED">LOCKED</option>
            </select>
          </div>
        )}
      </div>

      {/* Content Table Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden animate-in fade-in duration-300">
        
        {activeTab === "ADMINS" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/50">
                  <th className="p-4 px-6 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40" onClick={() => handleSort("employeeId")}>
                    <div className="flex items-center gap-1">
                      Employee ID <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th className="p-4 px-6 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40" onClick={() => handleSort("username")}>
                    <div className="flex items-center gap-1">
                      Product Admin <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th className="p-4 px-6">Email</th>
                  <th className="p-4 px-6">Application</th>
                  <th className="p-4 px-6">Designation</th>
                  <th className="p-4 px-6">Assigned Modules</th>
                  <th className="p-4 px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-800/50">
                {paginatedAdmins.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="p-4 px-6 font-mono font-bold text-[10px] text-slate-800 dark:text-slate-200">
                      {user.employeeId}
                    </td>
                    <td className="p-4 px-6">
                      <div>
                        <p className="font-extrabold text-slate-850 dark:text-slate-100">{user.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">@{user.username}</p>
                      </div>
                    </td>
                    <td className="p-4 px-6 font-mono text-[10px] text-slate-500 dark:text-slate-400">{user.email}</td>
                    <td className="p-4 px-6 font-extrabold text-indigo-650 dark:text-indigo-400">{user.applicationName}</td>
                    <td className="p-4 px-6 font-medium text-slate-700 dark:text-slate-355">{user.designation}</td>
                    <td className="p-4 px-6 max-w-[200px] truncate font-medium text-slate-500" title={user.department}>
                      {user.department}
                    </td>
                    <td className="p-4 px-6 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusBadge(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredAdmins.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">No product admins report records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/50">
                  <th className="p-4 px-6">Application Name</th>
                  <th className="p-4 px-6">Description</th>
                  <th className="p-4 px-6 text-center">Active Product Admins</th>
                  <th className="p-4 px-6">Created Date</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-800/50">
                {paginatedApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="p-4 px-6 font-extrabold text-slate-800 dark:text-slate-200">
                      {app.name}
                    </td>
                    <td className="p-4 px-6 font-medium text-slate-600 dark:text-slate-400 max-w-[300px] truncate">{app.description}</td>
                    <td className="p-4 px-6 text-center">
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-bold">
                        {app.productAdminsCount} admins
                      </span>
                    </td>
                    <td className="p-4 px-6 text-slate-400 font-medium">{new Date(app.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {filteredApps.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 font-bold">No applications report records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
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
