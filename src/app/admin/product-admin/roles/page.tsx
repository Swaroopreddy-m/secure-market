"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, Check, Save, Send, Loader2, AlertCircle, CheckCircle2, ChevronRight, Sliders
} from "lucide-react";

interface ProductAdminUser {
  id: string;
  employeeId: string;
  username: string;
  name: string;
  roleMatrixStatus: string;
  applicationName: string;
}

interface PermissionMapping {
  module: string;
  action: string;
  status?: string;
}

const ACTIONS = [
  "View", "Create", "Edit", "Delete", "Approve", 
  "Export", "Import", "Assign", "Activate", "Deactivate"
];

export default function ProductAdminRolesPage() {
  const router = useRouter();

  const [admins, setAdmins] = useState<ProductAdminUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  
  // Super Admin allowed modules (possesses) and Product Admin's currently assigned
  const [allowedModules, setAllowedModules] = useState<string[]>([]);
  const [mappings, setMappings] = useState<PermissionMapping[]>([]);
  const [userMatrixStatus, setUserMatrixStatus] = useState<string>("DRAFT");

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchLoading, setIsFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch list of Product Admins
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const res = await fetch("/api/super-admin/product-admins");
        if (!res.ok) throw new Error("Failed to load Product Admins");
        const data = await res.json();
        setAdmins(data);
        if (data.length > 0) {
          setSelectedUserId(data[0].id);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsFetchLoading(false);
      }
    };
    fetchAdmins();
  }, []);

  // Fetch permissions of selected Product Admin and allowed modules
  useEffect(() => {
    if (!selectedUserId) {
      setMappings([]);
      setUserMatrixStatus("DRAFT");
      return;
    }

    const fetchPermissions = async () => {
      setIsFetchLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const res = await fetch(`/api/super-admin/roles?userId=${selectedUserId}`);
        if (!res.ok) throw new Error("Failed to load Product Admin roles matrix");
        const data = await res.json();

        // 1. Compile allowed modules list from Super Admin's owned permissions
        const superPerms = data.superAdminPermissions as { module: string; action: string }[];
        const uniqueModules = Array.from(new Set(superPerms.map(p => p.module)));
        setAllowedModules(uniqueModules);

        // 2. Set Product Admin's active mappings
        const productPerms = data.productAdminPermissions as PermissionMapping[];
        setMappings(productPerms);

        const u = admins.find(adm => adm.id === selectedUserId);
        setUserMatrixStatus(u?.roleMatrixStatus || "DRAFT");
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsFetchLoading(false);
      }
    };

    fetchPermissions();
  }, [selectedUserId, admins]);

  const isChecked = (mod: string, act: string) => {
    return mappings.some(m => m.module === mod && m.action === act);
  };

  const handleToggle = (mod: string, act: string) => {
    if (userMatrixStatus === "PENDING") {
      setError("Pending matrix submissions cannot be updated until Checker decision.");
      return;
    }
    setMappings(prev => {
      const exists = prev.some(m => m.module === mod && m.action === act);
      if (exists) {
        return prev.filter(m => !(m.module === mod && m.action === act));
      } else {
        return [...prev, { module: mod, action: act, status: "DRAFT" }];
      }
    });
  };

  const handleGrantAll = () => {
    if (userMatrixStatus === "PENDING") return;
    const all: PermissionMapping[] = [];
    allowedModules.forEach(mod => {
      ACTIONS.forEach(act => {
        all.push({ module: mod, action: act, status: "DRAFT" });
      });
    });
    setMappings(all);
    setSuccess("Grant All checked. Click Save or Submit to persist changes.");
  };

  const handleRemoveAll = () => {
    if (userMatrixStatus === "PENDING") return;
    setMappings([]);
    setSuccess("Remove All checked. Click Save or Submit to persist changes.");
  };

  const handleSaveOrSubmit = async (status: "DRAFT" | "PENDING") => {
    if (!selectedUserId) return;
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/super-admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          permissions: mappings.map(m => ({ module: m.module, action: m.action })),
          submitStatus: status
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to persist roles matrix");
      }

      setSuccess(`Product Admin roles matrix successfully ${status === "PENDING" ? "submitted for Checker approval" : "saved as Draft"}.`);
      setUserMatrixStatus(status);
      
      // Update local state roles matrix status
      setAdmins(prev => prev.map(u => u.id === selectedUserId ? { ...u, roleMatrixStatus: status } : u));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getBadgeStyle = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50";
      case "APPROVED":
        return "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-200/50";
      case "REJECTED":
        return "bg-rose-50 text-rose-700 dark:bg-rose-955/20 dark:text-rose-450 border border-rose-200/50";
      case "RETURNED":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/50";
      default:
        return "bg-slate-50 text-slate-655 border border-slate-200/50";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Roles & Matrix (Maker)</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Assign modular access rights to Product Admin users. You can only assign permissions that the Developer has approved for your own account.
        </p>
      </div>

      {/* Selection row */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Select Product Admin User</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-64 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            {admins.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} (@{u.username}) [{u.applicationName}]
              </option>
            ))}
            {admins.length === 0 && (
              <option value="">No Product Admins registered</option>
            )}
          </select>
        </div>

        {selectedUserId && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">Roles Matrix Status:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getBadgeStyle(userMatrixStatus)}`}>
              {userMatrixStatus}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/30 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-450 text-xs font-bold">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-955/20 border border-green-100 dark:border-green-900/30 p-4 rounded-2xl flex items-center gap-3 text-green-600 dark:text-green-450 text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Grid Table */}
      {selectedUserId && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-sm relative">
          
          {isFetchLoading && (
            <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center z-10">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-650" />
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-5 min-w-[200px]">Module Name</th>
                  {ACTIONS.map(act => (
                    <th key={act} className="px-3 py-5 text-center min-w-[90px]">
                      <span className="text-slate-850 dark:text-slate-200 font-extrabold text-[10px] uppercase tracking-wider">{act}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-850">
                {allowedModules.map((modName) => (
                  <tr key={modName} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="px-6 py-4 font-extrabold text-slate-800 dark:text-slate-200">
                      {modName}
                    </td>
                    {ACTIONS.map((act) => {
                      const checked = isChecked(modName, act);
                      return (
                        <td key={act} className="px-3 py-4 text-center">
                          <label className="inline-flex items-center justify-center cursor-pointer p-1">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={userMatrixStatus === "PENDING" || isFetchLoading}
                              onChange={() => handleToggle(modName, act)}
                              className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 w-4 h-4 cursor-pointer disabled:opacity-50"
                            />
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {allowedModules.length === 0 && (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400 font-bold">
                      You do not possess any approved permissions from the Developer. You cannot delegate permissions to Product Admins.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Toolbar */}
          <div className="p-6 border-t border-slate-150 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            
            {/* Quick selectors */}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={userMatrixStatus === "PENDING" || isFetchLoading || allowedModules.length === 0}
                onClick={handleGrantAll}
                className="px-4 py-2 border dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-655 dark:text-slate-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                Grant All Possessed
              </button>
              <button
                type="button"
                disabled={userMatrixStatus === "PENDING" || isFetchLoading || allowedModules.length === 0}
                onClick={handleRemoveAll}
                className="px-4 py-2 border dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-655 dark:text-slate-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                Remove All
              </button>
            </div>

            {/* Save/Submit Decisions */}
            <div className="flex gap-3">
              <button
                type="button"
                disabled={isLoading || userMatrixStatus === "PENDING" || isFetchLoading || allowedModules.length === 0}
                onClick={() => handleSaveOrSubmit("DRAFT")}
                className="px-5 py-2.5 bg-white dark:bg-slate-900 border dark:border-slate-850 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Draft Matrix
              </button>

              <button
                type="button"
                disabled={isLoading || userMatrixStatus === "PENDING" || isFetchLoading || allowedModules.length === 0}
                onClick={() => handleSaveOrSubmit("PENDING")}
                className="px-6 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-650/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit for Confirmation
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
