"use client";

import { useState, useEffect } from "react";
import { 
  Check, X, RotateCcw, AlertCircle, CheckCircle, Search, 
  ChevronLeft, ChevronRight, Loader2, ShieldAlert, Download, Eye, EyeOff
} from "lucide-react";

interface PendingPermission {
  id: string;
  module: string;
  action: string;
  status: string;
}

interface PendingRoleUser {
  id: string;
  employeeId: string;
  username: string;
  name: string;
  userApprovalStatus: string;
  roleMatrixStatus: string;
  createdAt: string;
  updatedAt: string;
  applicationName: string;
  makerUsername: string;
  permissionsCount: number;
  superAdminPermissions: PendingPermission[];
}

const ACTIONS = [
  "View", "Create", "Edit", "Delete", "Approve", 
  "Export", "Import", "Assign", "Activate", "Deactivate"
];

export default function ProductAdminRolesConfirmPage() {
  const [pending, setPending] = useState<PendingRoleUser[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Loader & Alert States
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Remarks Modal State
  const [remarksOpen, setRemarksOpen] = useState(false);
  const [remarksText, setRemarksText] = useState("");
  const [remarksAction, setRemarksAction] = useState<"REJECT" | "RETURN" | "BULK_REJECT" | "BULK_RETURN">("REJECT");
  const [targetId, setTargetId] = useState<string | null>(null);

  // View Matrix comparison modal
  const [viewingUser, setViewingUser] = useState<PendingRoleUser | null>(null);

  const fetchPending = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/super-admin/roles/confirm");
      if (!res.ok) throw new Error("Failed to load pending Roles Matrix submissions");
      const data = await res.json();
      setPending(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  // Filter
  const filteredList = pending.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.employeeId.toLowerCase().includes(search.toLowerCase()) ||
    u.applicationName.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination Slice
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const paginatedList = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedList.map(u => u.id));
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

  const submitDecision = async (ids: string[], action: "APPROVE" | "REJECT" | "RETURN", remarks: string | null) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/super-admin/roles/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action, remarks })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to log ${action.toLowerCase()} decision`);
      }

      setSuccess(`Decision logged successfully: roles matrix ${action} for ${ids.length} Product Admins.`);
      setSelectedIds([]);
      fetchPending();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = (id: string) => {
    submitDecision([id], "APPROVE", null);
  };

  const handleBulkApprove = () => {
    if (selectedIds.length === 0) return;
    submitDecision(selectedIds, "APPROVE", null);
  };

  const openRemarks = (action: typeof remarksAction, id: string | null = null) => {
    setRemarksAction(action);
    setTargetId(id);
    setRemarksText("");
    setRemarksOpen(true);
  };

  const handleRemarksSubmit = () => {
    if (!remarksText.trim()) return;
    setRemarksOpen(false);

    if (remarksAction === "REJECT" && targetId) {
      submitDecision([targetId], "REJECT", remarksText);
    } else if (remarksAction === "RETURN" && targetId) {
      submitDecision([targetId], "RETURN", remarksText);
    } else if (remarksAction === "BULK_REJECT") {
      submitDecision(selectedIds, "REJECT", remarksText);
    } else if (remarksAction === "BULK_RETURN") {
      submitDecision(selectedIds, "RETURN", remarksText);
    }
  };

  const hasPermission = (user: PendingRoleUser, mod: string, act: string) => {
    return user.superAdminPermissions.some(p => p.module.toLowerCase() === mod.toLowerCase() && p.action.toLowerCase() === act.toLowerCase());
  };

  const handleExportCSV = () => {
    const headers = ["Product Admin Name", "Username", "Employee ID", "Application", "Maker Username", "Rights Count", "Status"];
    const rows = filteredList.map(u => [
      u.name, u.username, u.employeeId, u.applicationName, u.makerUsername, String(u.permissionsCount), u.roleMatrixStatus
    ]);
    const csvContent = 
      "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pending_roles_checker_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Roles & Matrix Confirmation</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Review pending role permission matrix submissions for Product Admin accounts.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 rounded-2xl text-xs font-bold text-slate-655 dark:text-slate-400 shadow-sm cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export Spreadsheet
        </button>
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

      {/* Bulk Actions Panel */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 px-6 py-4 rounded-3xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-in fade-in duration-300">
          <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400">
            {selectedIds.length} pending matrix submissions selected
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleBulkApprove}
              disabled={isSubmitting}
              className="flex items-center gap-1 px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md cursor-pointer"
            >
              <Check className="w-4 h-4" /> Bulk Approve
            </button>
            <button
              onClick={() => openRemarks("BULK_REJECT")}
              disabled={isSubmitting}
              className="flex items-center gap-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold shadow-md cursor-pointer"
            >
              <X className="w-4 h-4" /> Bulk Reject
            </button>
            <button
              onClick={() => openRemarks("BULK_RETURN")}
              disabled={isSubmitting}
              className="flex items-center gap-1 px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-2xl text-xs font-bold shadow-md cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Bulk Return
            </button>
          </div>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search pending matrices by name, username, employee ID or application..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-foreground"
          />
        </div>
      </div>

      {/* Grid Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden animate-in fade-in">
        
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-650" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/50">
                  <th className="p-4 px-6 w-12 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        paginatedList.length > 0 &&
                        paginatedList.every((u) => selectedIds.includes(u.id))
                      }
                      className="rounded border-slate-300 text-indigo-650 cursor-pointer"
                    />
                  </th>
                  <th className="p-4 px-6">Employee ID</th>
                  <th className="p-4 px-6">Product Admin</th>
                  <th className="p-4 px-6">Application</th>
                  <th className="p-4 px-6">Submitted By (Maker)</th>
                  <th className="p-4 px-6">Grant Rights Count</th>
                  <th className="p-4 px-6">Submitted Date</th>
                  <th className="p-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-800/50">
                {paginatedList.map((user) => {
                  const isSelected = selectedIds.includes(user.id);
                  return (
                    <tr key={user.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors ${isSelected ? "bg-indigo-50/10 dark:bg-indigo-950/5" : ""}`}>
                      <td className="p-4 px-6 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(user.id, e.target.checked)}
                          className="rounded border-slate-300 text-indigo-650 cursor-pointer"
                        />
                      </td>
                      <td className="p-4 px-6 font-mono font-bold text-[10px] text-slate-855 dark:text-slate-200">
                        {user.employeeId}
                      </td>
                      <td className="p-4 px-6">
                        <div>
                          <p className="font-extrabold text-slate-850 dark:text-slate-150">{user.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold">@{user.username}</p>
                        </div>
                      </td>
                      <td className="p-4 px-6 font-extrabold text-indigo-650 dark:text-indigo-400">
                        {user.applicationName}
                      </td>
                      <td className="p-4 px-6 text-slate-700 dark:text-slate-300">
                        <p className="font-extrabold">{user.makerUsername}</p>
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-indigo-50 dark:bg-indigo-955 text-[8px] text-indigo-600 dark:text-indigo-400 rounded font-black uppercase">MAKER</span>
                      </td>
                      <td className="p-4 px-6 font-bold text-slate-700 dark:text-slate-300">
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-extrabold text-slate-700 dark:text-slate-350">
                          {user.permissionsCount} Rights
                        </span>
                      </td>
                      <td className="p-4 px-6 text-slate-400 font-medium">
                        {new Date(user.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          
                          {/* View Grid Matrix Comparison */}
                          <button
                            title="View Matrix Details"
                            onClick={() => setViewingUser(user)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-xl transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Approve */}
                          <button
                            title="Approve Matrix"
                            disabled={isSubmitting}
                            onClick={() => handleApprove(user.id)}
                            className="p-1.5 hover:bg-green-50 text-green-600 rounded-xl transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>

                          {/* Reject */}
                          <button
                            title="Reject Matrix"
                            disabled={isSubmitting}
                            onClick={() => openRemarks("REJECT", user.id)}
                            className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-xl transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          {/* Return to Maker */}
                          <button
                            title="Return Matrix"
                            disabled={isSubmitting}
                            onClick={() => openRemarks("RETURN", user.id)}
                            className="p-1.5 hover:bg-slate-100 text-slate-655 rounded-xl transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
                {pending.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">No pending roles matrix confirmation submissions found.</td>
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

      {/* Grid Comparison Modal */}
      {viewingUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-5xl w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-955 text-indigo-650 flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {viewingUser.username.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 tracking-tight">Pending Roles Matrix: {viewingUser.name}</h3>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md text-[9px] font-black uppercase tracking-wider mt-0.5 inline-block">
                    Submitted by {viewingUser.makerUsername}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingUser(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Matrix View */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl max-h-[50vh] overflow-y-auto hide-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-4 py-3 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10">Module</th>
                    {ACTIONS.map(act => (
                      <th key={act} className="px-2 py-3 text-center min-w-[70px]">
                        <span className="text-slate-850 dark:text-slate-200 font-extrabold">{act}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-850">
                  {Array.from(new Set(viewingUser.superAdminPermissions.map(p => p.module))).map((modName) => (
                    <tr key={modName} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="px-4 py-2 font-extrabold text-slate-800 dark:text-slate-200 sticky left-0 bg-white dark:bg-slate-900">
                        {modName}
                      </td>
                      {ACTIONS.map((act) => {
                        const hasPerm = hasPermission(viewingUser, modName, act);
                        return (
                          <td key={act} className="px-2 py-2 text-center">
                            {hasPerm ? (
                              <CheckCircle className="w-4 h-4 text-green-655 mx-auto" />
                            ) : (
                              <span className="text-slate-300 dark:text-slate-700">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {viewingUser.superAdminPermissions.length === 0 && (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400 font-bold">
                        No permissions assigned in this matrix.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setViewingUser(null)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl text-xs font-bold transition-all cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remarks Modal */}
      {remarksOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center gap-2 text-rose-500 font-extrabold text-base">
              <ShieldAlert className="w-5 h-5" />
              <span>Checker Remarks Required</span>
            </div>
            
            <p className="text-xs text-slate-500 font-medium pb-2 leading-relaxed">
              You are performing a <strong className="text-rose-500">{remarksAction.replace("BULK_", "")}</strong> operation on the roles matrix. 
              Enterprise Maker-Checker protocols require you to log the reasons and remarks.
            </p>

            <textarea
              rows={3}
              value={remarksText}
              onChange={(e) => setRemarksText(e.target.value)}
              placeholder="Provide reason for rejection or return..."
              className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-xs font-bold text-foreground resize-none"
            />

            <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-850">
              <button
                onClick={() => setRemarksOpen(false)}
                className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-655"
              >
                Cancel
              </button>
              <button
                disabled={!remarksText.trim() || isSubmitting}
                onClick={handleRemarksSubmit}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                Submit Decision
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
