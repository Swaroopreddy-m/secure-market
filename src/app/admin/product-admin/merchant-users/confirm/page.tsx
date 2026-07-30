"use client";

import { useState, useEffect } from "react";
import { 
  CheckSquare, Check, X, Undo, AlertCircle, Loader2, Search, Filter, HelpCircle, 
  MessageSquare, FileText, ChevronRight
} from "lucide-react";

interface PendingUser {
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
  makerUsername: string;
  createdAt: string;
}

export default function ConfirmUsersPage() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Remarks modal state
  const [remarksAction, setRemarksAction] = useState<"APPROVE" | "REJECT" | "RETURN" | "BULK_APPROVE" | "BULK_REJECT" | "BULK_RETURN" | null>(null);
  const [remarksText, setRemarksText] = useState("");

  const fetchPending = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/product-admin/merchant-users/confirm");
      if (!res.ok) throw new Error("Failed to load pending Merchant Users");
      const data = await res.json();
      setUsers(data);
      setSelectedIds([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredUsers.map(u => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleOpenRemarksModal = (action: typeof remarksAction, targetId?: string) => {
    if (targetId) {
      setSelectedIds([targetId]);
    }
    setRemarksAction(action);
    setRemarksText("");
    setError(null);
  };

  const handleCloseRemarksModal = () => {
    setRemarksAction(null);
    setRemarksText("");
  };

  const handleActionSubmit = async () => {
    if (!remarksAction) return;
    
    const isBulk = remarksAction.startsWith("BULK_");
    const resolvedAction = remarksAction.replace("BULK_", "") as "APPROVE" | "REJECT" | "RETURN";

    if ((resolvedAction === "REJECT" || resolvedAction === "RETURN") && !remarksText.trim()) {
      setError("Remarks are mandatory for Reject and Return decisions.");
      return;
    }

    setIsSubmitLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/product-admin/merchant-users/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          action: resolvedAction,
          remarks: remarksText
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process decision.");

      setSuccess(`Successfully processed ${resolvedAction} decision for ${selectedIds.length} Merchant Users.`);
      handleCloseRemarksModal();
      fetchPending();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.employeeId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 p-6">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Confirm Merchant Users (Checker)</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Review and approve new Merchant User registrations. Approving updates user status pending role matrix confirmation.
        </p>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-3">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && !remarksAction && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-455 p-4 rounded-2xl text-xs font-bold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Control Row */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search pending users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-55 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-slate-700 dark:text-slate-200"
          />
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => handleOpenRemarksModal("BULK_APPROVE")}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider"
            >
              <Check className="w-3.5 h-3.5" /> Approve Bulk
            </button>
            <button
              onClick={() => handleOpenRemarksModal("BULK_RETURN")}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 border dark:border-slate-800 text-slate-700 dark:text-slate-350 rounded-xl font-bold text-[10px] uppercase tracking-wider"
            >
              <Undo className="w-3.5 h-3.5" /> Return Bulk
            </button>
            <button
              onClick={() => handleOpenRemarksModal("BULK_REJECT")}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider"
            >
              <X className="w-3.5 h-3.5" /> Reject Bulk
            </button>
          </div>
        )}

      </div>

      {/* Grid Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/40 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850">
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={filteredUsers.length > 0 && selectedIds.length === filteredUsers.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-300 bg-slate-50 text-indigo-650 focus:ring-indigo-650"
                  />
                </th>
                <th className="p-4">Employee ID</th>
                <th className="p-4">Username / Name</th>
                <th className="p-4">Department / Designation</th>
                <th className="p-4">Created By</th>
                <th className="p-4">Created Date</th>
                <th className="p-4">Remarks</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-semibold text-slate-655 dark:text-slate-350">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-650" />
                    Fetching pending Merchant Users...
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const isSelected = selectedIds.includes(u.id);
                  return (
                    <tr key={u.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors ${isSelected ? "bg-indigo-50/20 dark:bg-indigo-950/10" : ""}`}>
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectOne(u.id, e.target.checked)}
                          className="rounded border-slate-300 bg-slate-50 text-indigo-650 focus:ring-indigo-650"
                        />
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">{u.employeeId}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800 dark:text-slate-100">{u.username}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{u.name} ({u.email})</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold">{u.department || "No Dept"}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{u.designation || "No Title"}</div>
                      </td>
                      <td className="p-4 font-mono text-[10px]">{u.makerUsername}</td>
                      <td className="p-4 text-slate-400 font-medium">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 max-w-xs truncate text-[11px] font-semibold text-slate-500" title={u.remarks}>
                        {u.remarks || "-"}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenRemarksModal("APPROVE", u.id)}
                            className="p-2 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 rounded-xl transition-colors"
                            title="Approve User"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenRemarksModal("RETURN", u.id)}
                            className="p-2 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 text-slate-700 dark:text-slate-350 rounded-xl transition-colors"
                            title="Return for Edit"
                          >
                            <Undo className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenRemarksModal("REJECT", u.id)}
                            className="p-2 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 text-rose-700 dark:text-rose-450 rounded-xl transition-colors"
                            title="Reject User"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 dark:text-slate-500 font-bold">
                    No pending Merchant Users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Remarks Modal */}
      {remarksAction && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-indigo-500" />
              <h3 className="text-lg font-black text-slate-850 dark:text-slate-150">
                Confirm Checker Decision
              </h3>
            </div>

            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              You are performing a <strong className="text-indigo-650">{remarksAction.replace("BULK_", "")}</strong> action on {selectedIds.length} Merchant User(s).
            </p>

            {/* Error alerts inside modal */}
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-750 p-3.5 rounded-2xl text-[11px] font-bold">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Checker Decision Remarks 
                {(remarksAction.includes("REJECT") || remarksAction.includes("RETURN")) && " (MANDATORY)"}
              </label>
              <textarea
                rows={3}
                required={remarksAction.includes("REJECT") || remarksAction.includes("RETURN")}
                value={remarksText}
                onChange={(e) => setRemarksText(e.target.value)}
                placeholder="Provide details or reasons for this decision..."
                className="w-full bg-slate-50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCloseRemarksModal}
                disabled={isSubmitLoading}
                className="flex-1 px-4 py-3 border rounded-2xl font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleActionSubmit}
                disabled={isSubmitLoading}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-indigo-650/25"
              >
                {isSubmitLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Confirm Decision"
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
