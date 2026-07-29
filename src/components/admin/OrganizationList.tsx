"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Filter, Trash2, Edit2, Plus, CheckCircle, XCircle, AlertTriangle,
  Play, ShieldAlert, ArrowUpDown, ChevronLeft, ChevronRight, Building2, Clock, Globe, Shield
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
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter logic
  const filteredOrgs = orgs.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.code.toLowerCase().includes(search.toLowerCase()) ||
      (org.domain || "").toLowerCase().includes(search.toLowerCase()) ||
      (org.owner || "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "All" || org.status === statusFilter;
    const matchesSub = subFilter === "All" || org.subscription === subFilter;

    return matchesSearch && matchesStatus && matchesSub;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredOrgs.length / itemsPerPage);
  const paginatedOrgs = filteredOrgs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Status Change API Call
  const handleStatusChange = async (id: string, newStatus: string) => {
    setIsLoading(true);
    setError(null);
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
    try {
      const res = await fetch(`/api/organizations/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete organization");
      }

      setOrgs(prev => prev.filter(o => o.id !== id));
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">SaaS Organizations</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Manage tenant organizations, status modes, and billing subscriptions.</p>
        </div>
        <Link
          href="/admin/organizations/new"
          className="flex items-center gap-1.5 px-5 py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-650/20 active:scale-95 transition-all w-fit cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Provision Organization
        </Link>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/30 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-xs font-bold">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* 2. Filters Grid */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, code, domain, or owner..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-foreground"
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
                <th className="p-4 px-6">Organization</th>
                <th className="p-4 px-6">Domain & Owner</th>
                <th className="p-4 px-6">Super Admin</th>
                <th className="p-4 px-6">Subscription</th>
                <th className="p-4 px-6">Stats</th>
                <th className="p-4 px-6">Status</th>
                <th className="p-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-800/50">
              {paginatedOrgs.map((org) => {
                const superAdmin = org.users?.[0];
                return (
                  <tr key={org.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    
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

                    {/* Super Admin User */}
                    <td className="p-4 px-6 text-slate-700 dark:text-slate-300">
                      {superAdmin ? (
                        <div>
                          <p className="font-bold">{superAdmin.name}</p>
                          <p className="text-[10px] text-slate-450 dark:text-slate-500">{superAdmin.email}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No Super Admin</span>
                      )}
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
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-green-600 rounded-xl transition-colors cursor-pointer"
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

              {filteredOrgs.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">No organizations match the selected criteria.</td>
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

    </div>
  );
}
