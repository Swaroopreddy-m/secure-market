"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Filter, Trash2, Edit2, Plus, CheckCircle, XCircle, AlertTriangle,
  ArrowUpDown, ChevronLeft, ChevronRight, Building2, Globe, Shield, Eye, Download, Loader2, X
} from "lucide-react";

interface OrganizationRecord {
  id: string;
  name: string;
  code: string;
  logo: string | null;
  description: string | null;
  subscription: string;
  theme: string;
  status: string;
  owner: string | null;
  expiryDate: string | Date | null;
  domain: string | null;
  type?: string | null;
  remarks?: string | null;
  createdAt: string | Date;
  users: { id: string; name: string | null; email: string | null; username: string | null }[];
  customers: any[];
}

interface OrganizationListProps {
  initialOrgs: OrganizationRecord[];
}

export default function OrganizationList({ initialOrgs }: OrganizationListProps) {
  const router = useRouter();
  const [orgs, setOrgs] = useState<OrganizationRecord[]>(initialOrgs);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [subFilter, setSubFilter] = useState("All");
  
  // Sorting State
  const [sortField, setSortField] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Selection & Bulk actions State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");

  // Detail View State
  const [viewingOrg, setViewingOrg] = useState<OrganizationRecord | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Sort Handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  // Filter logic
  const filteredOrgs = orgs.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.code.toLowerCase().includes(search.toLowerCase()) ||
      (org.domain || "").toLowerCase().includes(search.toLowerCase()) ||
      (org.owner || "").toLowerCase().includes(search.toLowerCase()) ||
      (org.type || "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "All" || org.status === statusFilter;
    const matchesSub = subFilter === "All" || org.subscription === subFilter;

    return matchesSearch && matchesStatus && matchesSub;
  });

  // Sort logic applied on filtered results
  const sortedOrgs = [...filteredOrgs].sort((a, b) => {
    let aVal: any = a[sortField as keyof OrganizationRecord];
    let bVal: any = b[sortField as keyof OrganizationRecord];

    if (aVal === null || aVal === undefined) aVal = "";
    if (bVal === null || bVal === undefined) bVal = "";

    if (sortField === "createdAt") {
      const aTime = new Date(aVal).getTime();
      const bTime = new Date(bVal).getTime();
      return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
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

  // Pagination logic
  const totalPages = Math.ceil(sortedOrgs.length / itemsPerPage);
  const paginatedOrgs = sortedOrgs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Selection Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedOrgs.map((o) => o.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  // Bulk Actions API Call
  const handleBulkAction = async (actionType: string) => {
    if (selectedIds.length === 0) return;
    setError(null);
    setSuccess(null);

    if (actionType === "DELETE") {
      if (!confirm(`Are you sure you want to delete ${selectedIds.length} organizations and all their data?`)) {
        setBulkAction("");
        return;
      }
    }

    setIsLoading(true);
    try {
      const isDelete = actionType === "DELETE";
      const res = await fetch("/api/organizations/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          action: isDelete ? "DELETE" : "STATUS",
          status: isDelete ? undefined : actionType
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to execute bulk action");
      }

      if (isDelete) {
        setOrgs(prev => prev.filter(o => !selectedIds.includes(o.id)));
        setSuccess(`Successfully deleted ${selectedIds.length} organizations.`);
      } else {
        setOrgs(prev => prev.map(o => selectedIds.includes(o.id) ? { ...o, status: actionType } : o));
        setSuccess(`Successfully updated status of ${selectedIds.length} organizations.`);
      }

      setSelectedIds([]);
      setBulkAction("");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Status Change API Call
  const handleStatusChange = async (id: string, newStatus: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/organizations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update organization status");
      }

      const updated = await res.json();
      setOrgs(prev => prev.map(o => o.id === id ? { ...o, status: updated.status } : o));
      setSuccess(`Organization status updated to ${newStatus}.`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Organization API Call
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`WARNING: Are you sure you want to delete organization "${name}"? This will permanently delete all its users, customers, shops, applications, and all associated tenant data. This action is irreversible.`)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/organizations/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete organization");
      }

      setOrgs(prev => prev.filter(o => o.id !== id));
      setSuccess(`Organization "${name}" and all associated data deleted.`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = [
      "Organization Name", "Organization Code", "Type", "Domain", 
      "Owner", "Subscription Plan", "Theme", "Status", "Created Date", 
      "Expiry Date", "Remarks"
    ];
    const rows = sortedOrgs.map((org) => [
      org.name,
      org.code,
      org.type || "Retail Store",
      org.domain || "",
      org.owner || "",
      org.subscription,
      org.theme,
      org.status,
      new Date(org.createdAt).toISOString(),
      org.expiryDate ? new Date(org.expiryDate).toLocaleDateString() : "Never",
      org.remarks || ""
    ]);

    const csvContent = 
      "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map((r) => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `organizations_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-200/50";
      case "INACTIVE":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-400 border-slate-200/50";
      case "SUSPENDED":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200/50";
      case "DEACTIVATED":
        return "bg-rose-50 text-rose-700 dark:bg-rose-955/20 dark:text-rose-450 border-rose-200/50";
      default:
        return "bg-slate-50 text-slate-655 border-slate-200/50";
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">SaaS Organizations</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Manage tenant organizations, status modes, and billing subscriptions.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export Spreadsheet
          </button>
          <Link
            href="/admin/organizations/new"
            className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-600/15 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Provision Organization
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/30 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-xs font-bold animate-in fade-in duration-300">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-955/20 border border-green-100 dark:border-green-900/30 p-4 rounded-2xl flex items-center gap-3 text-green-600 dark:text-green-400 text-xs font-bold animate-in fade-in duration-300">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Bulk Actions Panel */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 px-6 py-4 rounded-3xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400">
            {selectedIds.length} organizations selected
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={bulkAction}
              onChange={(e) => {
                setBulkAction(e.target.value);
                if (e.target.value) handleBulkAction(e.target.value);
              }}
              disabled={isLoading}
              className="bg-white dark:bg-slate-900 border rounded-2xl px-3 py-2 text-xs font-bold focus:outline-none"
            >
              <option value="">Choose Bulk Action...</option>
              <option value="ACTIVE">Activate Selected</option>
              <option value="DEACTIVATED">Deactivate Selected</option>
              <option value="SUSPENDED">Suspend Selected</option>
              <option value="DELETE">Delete Selected</option>
            </select>
          </div>
        </div>
      )}

      {/* 2. Filters Grid */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, code, type, domain, or owner..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-foreground"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-2 px-3 text-xs font-bold text-slate-655 dark:text-slate-350 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="DEACTIVATED">DEACTIVATED</option>
          </select>

          <select
            value={subFilter}
            onChange={(e) => { setSubFilter(e.target.value); setCurrentPage(1); }}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-2 px-3 text-xs font-bold text-slate-655 dark:text-slate-350 focus:outline-none"
          >
            <option value="All">All Subscriptions</option>
            <option value="FREE">FREE</option>
            <option value="PRO">PRO</option>
            <option value="ENTERPRISE">ENTERPRISE</option>
            <option value="UNLIMITED">UNLIMITED</option>
          </select>
        </div>
      </div>

      {/* 3. Organizations Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/50">
                <th className="p-4 px-6 w-12 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      paginatedOrgs.length > 0 &&
                      paginatedOrgs.every((o) => selectedIds.includes(o.id))
                    }
                    className="rounded border-slate-300 text-indigo-600 cursor-pointer"
                  />
                </th>
                <th className="p-4 px-6 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40" onClick={() => handleSort("name")}>
                  <div className="flex items-center gap-1">
                    Organization <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="p-4 px-6 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40" onClick={() => handleSort("type")}>
                  <div className="flex items-center gap-1">
                    Type <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="p-4 px-6">Domain & Owner</th>
                <th className="p-4 px-6 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40" onClick={() => handleSort("subscription")}>
                  <div className="flex items-center gap-1">
                    Subscription <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="p-4 px-6">Stats</th>
                <th className="p-4 px-6 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40" onClick={() => handleSort("status")}>
                  <div className="flex items-center gap-1">
                    Status <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="p-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-800/50">
              {paginatedOrgs.map((org) => {
                const superAdmin = org.users?.[0];
                const isSelected = selectedIds.includes(org.id);
                return (
                  <tr key={org.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors ${isSelected ? "bg-indigo-50/10 dark:bg-indigo-950/5" : ""}`}>
                    
                    {/* Checkbox Column */}
                    <td className="p-4 px-6 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectRow(org.id, e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 cursor-pointer"
                      />
                    </td>

                    {/* Name & Code */}
                    <td className="p-4 px-6 font-bold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 flex items-center justify-center font-bold text-base flex-shrink-0">
                          {org.name.slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-slate-800 dark:text-slate-200 font-extrabold">{org.name}</p>
                          <p className="text-[10px] font-mono text-slate-450 dark:text-slate-500 font-medium mt-0.5">{org.code}</p>
                        </div>
                      </div>
                    </td>

                    {/* Organization Type */}
                    <td className="p-4 px-6 text-slate-700 dark:text-slate-300 font-bold">
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        {org.type || "Retail Store"}
                      </span>
                    </td>

                    {/* Domain & Owner */}
                    <td className="p-4 px-6 text-slate-700 dark:text-slate-350">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-[10px] font-mono">
                          <Globe className="w-3 h-3 text-slate-400" />
                          <span>{org.domain || "no domain"}</span>
                        </div>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium">Owner: {org.owner || "Unspecified"}</p>
                      </div>
                    </td>

                    {/* Subscription */}
                    <td className="p-4 px-6 font-bold text-slate-700 dark:text-slate-300">
                      <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-md text-[9px] font-black tracking-wider uppercase">
                        {org.subscription}
                      </span>
                    </td>

                    {/* Stats */}
                    <td className="p-4 px-6 text-slate-700 dark:text-slate-300 font-medium">
                      <p className="text-[11px] font-bold">{org.users.length} Users</p>
                      <p className="text-[9px] text-slate-450 dark:text-slate-500">{org.customers.length} Customers</p>
                    </td>

                    {/* Status Badge */}
                    <td className="p-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border w-fit flex items-center gap-1 ${getStatusBadge(org.status)}`}>
                        {org.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Quick View Details */}
                        <button
                          title="View Details"
                          onClick={() => setViewingOrg(org)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-xl transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Quick Toggles */}
                        {org.status === "ACTIVE" ? (
                          <button
                            title="Deactivate"
                            onClick={() => handleStatusChange(org.id, "DEACTIVATED")}
                            disabled={isLoading}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-xl transition-colors cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            title="Activate"
                            onClick={() => handleStatusChange(org.id, "ACTIVE")}
                            disabled={isLoading}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-green-655 rounded-xl transition-colors cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {org.status !== "SUSPENDED" && (
                          <button
                            title="Suspend"
                            onClick={() => handleStatusChange(org.id, "SUSPENDED")}
                            disabled={isLoading}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-amber-500 rounded-xl transition-colors cursor-pointer"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <Link
                          href={`/admin/organizations/${org.id}/edit`}
                          title="Edit Details"
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-500 rounded-xl transition-colors cursor-pointer inline-block"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          title="Delete Organization"
                          onClick={() => handleDelete(org.id, org.name)}
                          disabled={isLoading}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-600 rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {sortedOrgs.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">No organizations match the selected criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {totalPages > 1 && (
          <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1 || isLoading}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-1.5 border dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl disabled:opacity-50 text-slate-655 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages || isLoading}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-1.5 border dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl disabled:opacity-50 text-slate-655 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Viewing Details Dialog Modal */}
      {viewingOrg && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {viewingOrg.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 tracking-tight">{viewingOrg.name}</h3>
                  <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-md text-[9px] font-black uppercase tracking-wider mt-0.5 inline-block">
                    {viewingOrg.subscription} Plan
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingOrg(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
              
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">Organization Code</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{viewingOrg.code}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">Organization Type</span>
                <span className="text-slate-850 dark:text-slate-200">{viewingOrg.type || "Retail Store"}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">Owner / Contact</span>
                <span className="text-slate-850 dark:text-slate-200">{viewingOrg.owner || "Unspecified"}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">Domain slug</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{viewingOrg.domain || "No domain"}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">Status</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border w-fit ${getStatusBadge(viewingOrg.status)}`}>
                  {viewingOrg.status}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">Theme Setting</span>
                <span className="text-slate-850 dark:text-slate-200 capitalize">{viewingOrg.theme}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">Created Date</span>
                <span className="text-slate-850 dark:text-slate-200">{new Date(viewingOrg.createdAt).toLocaleString()}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">Expiry Date</span>
                <span className="text-slate-850 dark:text-slate-200">
                  {viewingOrg.expiryDate ? new Date(viewingOrg.expiryDate).toLocaleDateString() : "Never Expires"}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl space-y-1 col-span-1 md:col-span-2">
                <span className="text-[10px] text-slate-400 block font-medium">Remarks</span>
                <span className="text-slate-850 dark:text-slate-200 leading-normal font-medium">{viewingOrg.remarks || "No remarks logged."}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl space-y-1 col-span-1 md:col-span-2">
                <span className="text-[10px] text-slate-400 block font-medium">Business Description</span>
                <span className="text-slate-855 dark:text-slate-300 leading-relaxed font-medium block whitespace-pre-line">
                  {viewingOrg.description || "No description provided."}
                </span>
              </div>

              {/* Connected details */}
              <div className="col-span-1 md:col-span-2 border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-between text-[11px]">
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4 text-indigo-500" />
                  <span>{viewingOrg.users.length} Active Super Admins</span>
                </div>
                <div>
                  <span>{viewingOrg.customers.length} Onboarded Customers</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setViewingOrg(null)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl text-xs font-bold transition-all cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
