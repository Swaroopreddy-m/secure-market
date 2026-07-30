"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, UserPlus, Search, Edit2, Trash2, Copy, Send, Lock, HelpCircle, 
  Loader2, AlertCircle, CheckCircle2, MoreVertical, Undo, UserCheck, ShieldAlert
} from "lucide-react";
import Link from "next/link";

interface MerchantUser {
  id: string;
  employeeId: string;
  username: string;
  name: string;
  email: string;
  mobile: string;
  department: string;
  designation: string;
  reportingManager: string;
  remarks: string;
  status: string;
  userApprovalStatus: string;
  roleMatrixStatus: string;
  makerUsername: string;
  createdAt: string;
}

export default function MerchantUsersListPage() {
  const router = useRouter();

  const [users, setUsers] = useState<MerchantUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState<"ALL" | "DRAFT_PENDING" | "RETURNED" | "REJECTED" | "APPROVED_ACTIVE">("ALL");

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/product-admin/merchant-users");
      if (!res.ok) throw new Error("Failed to load Merchant Users");
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string, username: string) => {
    const conf = window.confirm(`Are you sure you want to delete Merchant User: ${username}?`);
    if (!conf) return;

    setIsActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/product-admin/merchant-users/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");

      setSuccess(`Merchant User ${username} deleted successfully.`);
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusBadgeClass = (appStatus: string, finalStatus: string) => {
    if (finalStatus === "ACTIVE") {
      return "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-200/50";
    }
    switch (appStatus) {
      case "PENDING":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50";
      case "REJECTED":
        return "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/50";
      case "RETURNED":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/50";
      case "DRAFT":
        return "bg-slate-50 text-slate-500 border border-slate-200/50";
      default:
        return "bg-slate-50 text-slate-500 border border-slate-200/50";
    }
  };

  // Filtering users based on search and tab selections
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.employeeId.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilterTab === "ALL") return true;
    if (activeFilterTab === "DRAFT_PENDING") {
      return u.userApprovalStatus === "DRAFT" || u.userApprovalStatus === "PENDING";
    }
    if (activeFilterTab === "RETURNED") {
      return u.userApprovalStatus === "RETURNED";
    }
    if (activeFilterTab === "REJECTED") {
      return u.userApprovalStatus === "REJECTED";
    }
    if (activeFilterTab === "APPROVED_ACTIVE") {
      return u.userApprovalStatus === "APPROVED";
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 p-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Merchant Users Management</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Create, update, and manage merchant account credentials under Maker-Checker controls.
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/product-admin/merchant-users/new")}
          className="flex items-center justify-center gap-1.5 px-5 py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-indigo-650/25 active:scale-95 transition-all"
        >
          <UserPlus className="w-4 h-4" /> Create Merchant User
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-455 p-4 rounded-2xl text-xs font-bold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="border-b border-slate-100 dark:border-slate-850 flex flex-wrap gap-2">
        {(["ALL", "DRAFT_PENDING", "RETURNED", "REJECTED", "APPROVED_ACTIVE"] as const).map(tab => {
          const tabLabel = tab === "ALL" ? "All Users" :
                           tab === "DRAFT_PENDING" ? "Draft / Pending" :
                           tab === "RETURNED" ? "Returned Records" :
                           tab === "REJECTED" ? "Rejected Records" : "Approved & Active";
          const isActive = activeFilterTab === tab;
          
          return (
            <button
              key={tab}
              onClick={() => setActiveFilterTab(tab)}
              className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer ${
                isActive 
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" 
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tabLabel}
            </button>
          );
        })}
      </div>

      {/* Search Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search merchants by employee ID, name, or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-slate-750 dark:text-slate-250"
          />
        </div>
      </div>

      {/* Grid List Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/40 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850">
                <th className="p-4">Employee ID</th>
                <th className="p-4">Username / Name</th>
                <th className="p-4">Contact Details</th>
                <th className="p-4">Department / Designation</th>
                <th className="p-4">Workflow Status</th>
                <th className="p-4">Roles Confirm</th>
                <th className="p-4">Remarks</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-semibold text-slate-655 dark:text-slate-350">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-650" />
                    Fetching Merchant Users catalog...
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const isEditable = u.userApprovalStatus !== "APPROVED";
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">{u.employeeId}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800 dark:text-slate-100">{u.username}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{u.name}</div>
                      </td>
                      <td className="p-4">
                        <div>{u.email}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{u.mobile}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold">{u.department || "-"}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{u.designation || "-"}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusBadgeClass(u.userApprovalStatus, u.status)}`}>
                          {u.userApprovalStatus === "APPROVED" ? u.status : u.userApprovalStatus}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusBadgeClass(u.roleMatrixStatus, u.status)}`}>
                          {u.roleMatrixStatus}
                        </span>
                      </td>
                      <td className="p-4 max-w-xs truncate text-[11px] font-medium" title={u.remarks}>
                        {u.remarks || "-"}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isEditable ? (
                            <>
                              <button
                                onClick={() => router.push(`/admin/product-admin/merchant-users/new?edit=${u.id}`)}
                                disabled={isActionLoading}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-650 rounded-xl transition-all"
                                title="Edit Record"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(u.id, u.username)}
                                disabled={isActionLoading}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-600 rounded-xl transition-all"
                                title="Delete Record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <div className="p-2 text-slate-400" title="Approved record locked from direct editing.">
                              <Lock className="w-4 h-4" />
                            </div>
                          )}
                          <button
                            onClick={() => router.push(`/admin/product-admin/merchant-users/new?clone=${u.id}`)}
                            disabled={isActionLoading}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-amber-600 rounded-xl transition-all"
                            title="Clone User Template"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 dark:text-slate-500 font-bold">
                    No Merchant Users found under this filter.
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
