"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Search, Filter, Download, Trash2, Edit2, ShieldAlert,
  UserPlus, CheckCircle, XCircle, ArrowUpDown, ChevronLeft, ChevronRight,
  UserCheck, Briefcase, Tag, AlertCircle, ShoppingBag, Building2
} from "lucide-react";

interface UserRecord {
  id: string;
  employeeId: string | null;
  username: string | null;
  name: string | null;
  email: string | null;
  role: string;
  department: string | null;
  status: string;
  lastLogin: Date | string | null;
  assignedProducts: { id: string; name: string; code: string }[];
  assignedCustomers: { id: string; companyName: string; customerId: string }[];
}

interface UserManagementProps {
  initialUsers: UserRecord[];
  allRoles: { id: string; name: string }[];
  allProducts: { id: string; name: string; code: string }[];
  allCustomers: { id: string; companyName: string; customerId: string }[];
}

export default function UserManagement({
  initialUsers,
  allRoles,
  allProducts,
  allCustomers
}: UserManagementProps) {
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkRole, setBulkRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Unique departments for filter dropdown
  const departments = Array.from(
    new Set(initialUsers.map(u => u.department).filter(Boolean))
  ) as string[];

  // Filter logic
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      (user.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (user.username?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (user.email?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (user.employeeId?.toLowerCase() || "").includes(search.toLowerCase());

    const matchesRole = roleFilter === "All" || user.role === roleFilter;
    const matchesDept = deptFilter === "All" || user.department === deptFilter;
    const matchesStatus = statusFilter === "All" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesDept && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedUsers.map((u) => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  // CSV Export (Step 7)
  const handleExportCSV = () => {
    const headers = ["Employee ID", "Username", "Full Name", "Email", "Role", "Department", "Status", "Last Login"];
    const rows = filteredUsers.map((u) => [
      u.employeeId || "",
      u.username || "",
      u.name || "",
      u.email || "",
      u.role,
      u.department || "",
      u.status,
      u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never"
    ]);

    const csvContent = 
      "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map((r) => r.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `users_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bulk Delete (Step 7)
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete the ${selectedIds.length} selected users?`)) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/saas-users/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to bulk delete users");
      }

      setUsers(prev => prev.filter(u => !selectedIds.includes(u.id)));
      setSelectedIds([]);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Bulk Role Assignment (Step 7)
  const handleBulkRoleAssign = async (roleName: string) => {
    if (selectedIds.length === 0 || !roleName) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/saas-users/bulk-assign-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, role: roleName })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to assign bulk roles");
      }

      setUsers(prev => prev.map(u => 
        selectedIds.includes(u.id) ? { ...u, role: roleName } : u
      ));
      setBulkRole("");
      setSelectedIds([]);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Enterprise Users</h2>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <Link 
            href="/admin/users/new" 
            className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-600/10"
          >
            <UserPlus className="w-4 h-4" /> Add User
          </Link>
        </div>
      </div>

      {/* Bulk Actions panel */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 px-6 py-4 rounded-3xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400">
            {selectedIds.length} users selected for bulk actions
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={bulkRole}
              onChange={(e) => {
                setBulkRole(e.target.value);
                handleBulkRoleAssign(e.target.value);
              }}
              className="bg-white dark:bg-slate-900 border rounded-2xl px-3 py-2 text-xs font-bold focus:outline-none"
            >
              <option value="">Bulk Assign Role...</option>
              {allRoles.map(r => (
                <option key={r.id} value={r.name}>{r.name.replace("_", " ")}</option>
              ))}
            </select>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold"
            >
              <Trash2 className="w-3.5 h-3.5" /> Bulk Delete
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col lg:flex-row items-center gap-4">
        {/* Search */}
        <div className="flex-1 w-full relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name, username, email or ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2.5 text-xs font-bold appearance-none w-full sm:w-auto min-w-[120px]"
          >
            <option value="All">Role: All</option>
            {allRoles.map(r => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>

          <select
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2.5 text-xs font-bold appearance-none w-full sm:w-auto min-w-[120px]"
          >
            <option value="All">Department: All</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2.5 text-xs font-bold appearance-none w-full sm:w-auto min-w-[120px]"
          >
            <option value="All">Status: All</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="LOCKED">LOCKED</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl flex items-center gap-2 text-xs font-bold">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-5 w-12 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      paginatedUsers.length > 0 &&
                      paginatedUsers.every((u) => selectedIds.includes(u.id))
                    }
                    className="rounded border-slate-300 text-indigo-600"
                  />
                </th>
                <th className="px-6 py-5">User Profile</th>
                <th className="px-6 py-5">Role / Dept</th>
                <th className="px-6 py-5">Assigned Scopes</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Last Login</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-850">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                  <td className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(user.id)}
                      onChange={(e) => handleSelectRow(user.id, e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 font-black text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                        {user.name?.[0].toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-800 dark:text-slate-100 truncate">{user.name || "System User"}</p>
                        <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                        <span className="inline-block font-mono text-[9px] text-slate-400 mt-0.5">ID: {user.employeeId || "N/A"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-[9px] font-black uppercase block w-fit mb-1">
                      {user.role}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{user.department || "No Dept"}</span>
                  </td>
                  <td className="px-6 py-4 space-y-1">
                    {/* Products */}
                    {user.assignedProducts.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                        {user.assignedProducts.map(p => (
                          <span key={p.id} className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-450 font-bold uppercase">{p.code}</span>
                        ))}
                      </div>
                    )}
                    {/* Customers */}
                    {user.assignedCustomers.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {user.assignedCustomers.map(c => (
                          <span key={c.id} className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-450 font-bold">{c.companyName}</span>
                        ))}
                      </div>
                    )}
                    {user.assignedProducts.length === 0 && user.assignedCustomers.length === 0 && (
                      <span className="text-[10px] text-slate-400 italic">No direct assignments</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      user.status === "ACTIVE" 
                        ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" 
                        : user.status === "LOCKED"
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-450"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-450"
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-[10px] font-medium">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="p-2 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-600/30 transition-all"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No users matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Page {currentPage} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 border disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 border disabled:opacity-50"
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
