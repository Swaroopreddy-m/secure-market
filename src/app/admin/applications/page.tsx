"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Edit2, Trash2, Sliders, Search, Download, ArrowUpDown, 
  ChevronLeft, ChevronRight, Loader2, AlertCircle, CheckCircle, X, Check, Eye
} from "lucide-react";

interface ApplicationRecord {
  id: string;
  name: string;
  description: string;
  logo: string;
  createdAt: string;
  code: string;
  theme: string;
  status: string;
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<ApplicationRecord[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Pagination & Sorting States
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const itemsPerPage = 8;

  // Loader & Alert States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modals States
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ApplicationRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo: "/images/apps/default.png",
    theme: "light"
  });

  const fetchApps = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/super-admin/applications");
      if (!res.ok) throw new Error("Failed to load applications");
      const data = await res.json();
      setApps(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  // Sorting
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
  const filteredApps = apps.filter((app) => {
    const matchesSearch = 
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.code.toLowerCase().includes(search.toLowerCase()) ||
      app.description.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort Logic
  const sortedApps = [...filteredApps].sort((a, b) => {
    let aVal = a[sortField as keyof ApplicationRecord] || "";
    let bVal = b[sortField as keyof ApplicationRecord] || "";
    if (sortField === "createdAt") {
      return sortOrder === "asc"
        ? new Date(aVal).getTime() - new Date(bVal).getTime()
        : new Date(bVal).getTime() - new Date(aVal).getTime();
    }
    return sortOrder === "asc" 
      ? String(aVal).localeCompare(String(bVal)) 
      : String(bVal).localeCompare(String(aVal));
  });

  // Pagination Slice
  const totalPages = Math.ceil(sortedApps.length / itemsPerPage);
  const paginatedApps = sortedApps.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Form Reset
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      logo: "/images/apps/default.png",
      theme: "light"
    });
  };

  // CRUD API Calls
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/super-admin/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create application");
      }
      setSuccess(`Application ${formData.name} created successfully!`);
      setCreateOpen(false);
      resetForm();
      fetchApps();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/super-admin/applications/${selectedApp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to edit application");
      }
      setSuccess(`Application ${formData.name} updated successfully!`);
      setEditOpen(false);
      setSelectedApp(null);
      resetForm();
      fetchApps();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (app: ApplicationRecord) => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    const nextStatus = app.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await fetch(`/api/super-admin/applications/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) throw new Error("Failed to change application status");
      setSuccess(`Application status changed to ${nextStatus}!`);
      fetchApps();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedApp) return;
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/super-admin/applications/${selectedApp.id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete application");
      setSuccess(`Application ${selectedApp.name} soft deleted!`);
      setDeleteOpen(false);
      setSelectedApp(null);
      fetchApps();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Open Modals Helpers
  const openEdit = (app: ApplicationRecord) => {
    setSelectedApp(app);
    setFormData({
      name: app.name,
      description: app.description,
      logo: app.logo,
      theme: app.theme
    });
    setEditOpen(true);
  };

  const openDelete = (app: ApplicationRecord) => {
    setSelectedApp(app);
    setDeleteOpen(true);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ["Application Name", "Application Code", "Description", "Theme", "Status", "Created Date"];
    const rows = filteredApps.map(app => [
      app.name, app.code, app.description, app.theme, app.status, new Date(app.createdAt).toLocaleDateString()
    ]);
    const csvContent = 
      "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `applications_list_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Applications Management</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Configure application settings, theme configurations, logos, and lifecycle states.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 rounded-2xl text-xs font-bold text-slate-655 dark:text-slate-400 shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={() => { resetForm(); setCreateOpen(true); }}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-650/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Application
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/30 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-450 text-xs font-bold animate-in fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-955/20 border border-green-100 dark:border-green-900/30 p-4 rounded-2xl flex items-center gap-3 text-green-600 dark:text-green-450 text-xs font-bold animate-in fade-in">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Search and filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search applications by name, code or description..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-foreground"
          />
        </div>

        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-2 px-3 text-xs font-bold text-slate-655 dark:text-slate-300 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
      </div>

      {/* Grid List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden animate-in fade-in duration-300">
        
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-650" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/50">
                  <th className="p-4 px-6 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40" onClick={() => handleSort("code")}>
                    <div className="flex items-center gap-1">
                      App Code <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th className="p-4 px-6 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40" onClick={() => handleSort("name")}>
                    <div className="flex items-center gap-1">
                      App Profile <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th className="p-4 px-6">Description</th>
                  <th className="p-4 px-6 text-center">Theme</th>
                  <th className="p-4 px-6 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40" onClick={() => handleSort("createdAt")}>
                    <div className="flex items-center gap-1">
                      Created Date <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th className="p-4 px-6 text-center">Status</th>
                  <th className="p-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-800/50">
                {paginatedApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="p-4 px-6 font-mono font-bold text-[10px] text-slate-800 dark:text-slate-200">
                      {app.code}
                    </td>
                    <td className="p-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {app.logo ? (
                            <img src={app.logo} alt="Logo" className="w-full h-full object-contain rounded-xl" />
                          ) : (
                            app.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-850 dark:text-slate-100">{app.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 px-6 font-medium text-slate-500 max-w-[250px] truncate">{app.description}</td>
                    <td className="p-4 px-6 text-center">
                      <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold rounded-lg uppercase">
                        {app.theme}
                      </span>
                    </td>
                    <td className="p-4 px-6 text-slate-400 font-medium">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 px-6 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        app.status === "ACTIVE" 
                          ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-200/50" 
                          : "bg-rose-50 text-rose-700 dark:bg-rose-955/20 dark:text-rose-450 border border-rose-200/50"
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Toggle Status */}
                        <button
                          title={app.status === "ACTIVE" ? "Deactivate" : "Activate"}
                          onClick={() => handleToggleStatus(app)}
                          className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                            app.status === "ACTIVE" 
                              ? "hover:bg-amber-50 text-amber-600 border-transparent"
                              : "hover:bg-green-50 text-green-600 border-transparent"
                          }`}
                        >
                          {app.status === "ACTIVE" ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                        </button>

                        {/* Edit */}
                        <button
                          title="Edit Application"
                          onClick={() => openEdit(app)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-xl transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          title="Delete Application"
                          onClick={() => openDelete(app)}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-955/20 text-rose-500 rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredApps.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">No application records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Toolbar */}
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

      {/* Create Dialog Modal */}
      {createOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-850">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Create New Application</h3>
              <button onClick={() => setCreateOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Application Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Vegetables Market"
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2 px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Describe the application features..."
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2 px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Logo Image URL</label>
                <input
                  type="text"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  placeholder="/images/apps/default.png"
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2 px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Application Theme</label>
                <select
                  value={formData.theme}
                  onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-2 px-3 text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value="light">Light Theme Mode</option>
                  <option value="dark">Dark Theme Mode</option>
                  <option value="emerald">Emerald Theme Mode</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-655"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md flex items-center justify-center gap-1 cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Dialog Modal */}
      {editOpen && selectedApp && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-850">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Edit Application: {selectedApp.name}</h3>
              <button onClick={() => setEditOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Application Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Vegetables Market"
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2 px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Describe the application features..."
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2 px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Logo Image URL</label>
                <input
                  type="text"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  placeholder="/images/apps/default.png"
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2 px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Application Theme</label>
                <select
                  value={formData.theme}
                  onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2 px-3 text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value="light">Light Theme Mode</option>
                  <option value="dark">Dark Theme Mode</option>
                  <option value="emerald">Emerald Theme Mode</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-655"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md flex items-center justify-center gap-1 cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteOpen && selectedApp && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2 text-rose-500">
              <AlertCircle className="w-5 h-5" />
              <span>Confirm Delete Application</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Are you sure you want to delete application <strong>{selectedApp.name}</strong>? All associated products and shops will be isolated. This is a soft-delete operation.
            </p>
            <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-850">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-655"
              >
                Cancel
              </button>
              <button
                disabled={isSaving}
                onClick={handleDeleteSubmit}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Application"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
