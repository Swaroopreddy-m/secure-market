"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  ShieldCheck, Check, Save, Send, Loader2, AlertCircle, CheckCircle2, ChevronRight, Sliders
} from "lucide-react";

interface MerchantUser {
  id: string;
  employeeId: string;
  username: string;
  name: string;
  roleMatrixStatus: string;
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

export default function MerchantRolesMatrixPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const role = session?.user?.role;

  const [users, setUsers] = useState<MerchantUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  
  // Modules allowed (possessed) by Admin, and target user mappings
  const [allowedModules, setAllowedModules] = useState<string[]>([]);
  const [productAdminPossessed, setProductAdminPossessed] = useState<PermissionMapping[]>([]);
  const [mappings, setMappings] = useState<PermissionMapping[]>([]);
  const [userMatrixStatus, setUserMatrixStatus] = useState<string>("DRAFT");
  const [checkerEnabled, setCheckerEnabled] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchLoading, setIsFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch eligible Users (Product Admins if Super Admin, else Merchant Users)
  useEffect(() => {
    if (!role) return;
    const fetchUsers = async () => {
      try {
        const url = role === "SUPER_ADMIN"
          ? "/api/super-admin/product-admins"
          : "/api/product-admin/merchant-users";

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load users");
        const data = await res.json();
        
        // ONLY Approved Users are eligible
        const eligible = data.filter((u: any) => u.userApprovalStatus === "APPROVED");
        setUsers(eligible);
        if (eligible.length > 0) {
          setSelectedUserId(eligible[0].id);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsFetchLoading(false);
      }
    };
    fetchUsers();
  }, [role]);

  // Fetch Checker configuration
  useEffect(() => {
    const fetchCheckerConfig = async () => {
      try {
        const res = await fetch("/api/auth/session-config");
        const data = await res.json();
        setCheckerEnabled(data.checkerEnabled === "true");
      } catch (e) {
        console.error(e);
      }
    };
    fetchCheckerConfig();
  }, []);

  // Fetch permissions mapping for selected User
  useEffect(() => {
    if (!selectedUserId || !role) {
      setMappings([]);
      setUserMatrixStatus("DRAFT");
      return;
    }

    const fetchPermissions = async () => {
      setIsFetchLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const url = role === "SUPER_ADMIN"
          ? `/api/super-admin/roles?userId=${selectedUserId}`
          : `/api/product-admin/roles?userId=${selectedUserId}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load roles matrix");
        const data = await res.json();

        // 1. Load Admin's owned permissions
        const possessed = (role === "SUPER_ADMIN"
          ? data.superAdminPermissions
          : data.productAdminPermissions) as PermissionMapping[];
        setProductAdminPossessed(possessed);
        
        const uniqueModules = Array.from(new Set(possessed.map(p => p.module)));
        setAllowedModules(uniqueModules);

        // 2. Set target User's currently assigned mappings
        const userPerms = (role === "SUPER_ADMIN"
          ? data.productAdminPermissions
          : data.merchantUserPermissions) as PermissionMapping[];
        setMappings(userPerms);

        const u = users.find(usr => usr.id === selectedUserId);
        setUserMatrixStatus(u?.roleMatrixStatus || "DRAFT");
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsFetchLoading(false);
      }
    };

    fetchPermissions();
  }, [selectedUserId, users, role]);

  const possessPermission = (mod: string, act: string) => {
    return productAdminPossessed.some(
      p => p.module.toLowerCase() === mod.toLowerCase() && p.action.toLowerCase() === act.toLowerCase()
    );
  };

  const isChecked = (mod: string, act: string) => {
    return mappings.some(m => m.module === mod && m.action === act);
  };

  const handleToggle = (mod: string, act: string) => {
    if (userMatrixStatus === "PENDING" && checkerEnabled) {
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

  const getModulePossessedActions = (mod: string) => {
    return ACTIONS.filter(act => possessPermission(mod, act));
  };

  const isModuleAllChecked = (mod: string) => {
    const possessed = getModulePossessedActions(mod);
    if (possessed.length === 0) return false;
    return possessed.every(act => isChecked(mod, act));
  };

  const handleToggleModuleAll = (mod: string) => {
    if (userMatrixStatus === "PENDING" && checkerEnabled) {
      setError("Pending matrix submissions cannot be updated until Checker decision.");
      return;
    }

    const possessed = getModulePossessedActions(mod);
    if (possessed.length === 0) return;

    const allChecked = isModuleAllChecked(mod);
    
    setMappings(prev => {
      const filtered = prev.filter(m => m.module !== mod);
      if (allChecked) {
        return filtered;
      } else {
        const newMappings = possessed.map(act => ({ module: mod, action: act, status: "DRAFT" }));
        return [...filtered, ...newMappings];
      }
    });
  };

  const handleGrantAll = () => {
    if (userMatrixStatus === "PENDING" && checkerEnabled) return;
    setMappings(productAdminPossessed);
    setSuccess("Grant All checked (restricted to permissions you own). Save or Submit to persist changes.");
  };

  const handleRemoveAll = () => {
    if (userMatrixStatus === "PENDING" && checkerEnabled) return;
    setMappings([]);
    setSuccess("Remove All checked. Save or Submit to persist changes.");
  };

  const handleSaveOrSubmit = async (status: "DRAFT" | "PENDING") => {
    if (!selectedUserId || !role) return;
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const url = role === "SUPER_ADMIN"
        ? "/api/super-admin/roles"
        : "/api/product-admin/roles";

      const res = await fetch(url, {
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

      const nextStatus = checkerEnabled ? status : "APPROVED";
      setSuccess(`Roles matrix successfully ${nextStatus === "APPROVED" ? "approved & activated" : (status === "PENDING" ? "submitted for Checker approval" : "saved as Draft")}.`);
      setUserMatrixStatus(nextStatus);
      
      // Update local state
      setUsers(prev => prev.map(u => u.id === selectedUserId ? { ...u, roleMatrixStatus: nextStatus } : u));
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
        return "bg-green-50 text-green-700 dark:bg-green-955/20 dark:text-green-400 border border-green-200/50";
      case "REJECTED":
        return "bg-rose-50 text-rose-700 dark:bg-rose-955/20 dark:text-rose-455 border border-rose-200/50";
      case "RETURNED":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/50";
      default:
        return "bg-slate-50 text-slate-655 border border-slate-200/50";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 p-6">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Roles & Matrix (Maker)</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {role === "SUPER_ADMIN" 
            ? "Assign rights to Product Admins. You can only assign permissions that the Developer has approved for your account."
            : "Assign rights to Merchant Users. You can only assign permissions that the Super Admin has approved for your account."}
        </p>
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

      {/* User Selection */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 w-full md:w-96">
          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {role === "SUPER_ADMIN" ? "Select Product Admin" : "Select Merchant User"}
          </label>
          {users.length > 0 ? (
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-850 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-slate-800 dark:text-slate-100 mt-1.5"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username} ({u.employeeId} - {u.name})
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-rose-500 font-bold mt-1.5 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> 
              {role === "SUPER_ADMIN" 
                ? "No Approved Product Admins eligible for role assignment."
                : "No Approved Merchant Users eligible for role assignment."}
            </p>
          )}
        </div>

        {selectedUserId && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">Roles Matrix Status:</span>
            <span className={`px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getBadgeStyle(userMatrixStatus)}`}>
              {userMatrixStatus}
            </span>
          </div>
        )}
      </div>

      {/* Permissions Matrix */}
      {selectedUserId && allowedModules.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
          
          <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-850 flex justify-between items-center flex-wrap gap-2">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-500" /> Assigned Privileges Matrix
            </span>
            {(!checkerEnabled || userMatrixStatus !== "PENDING") && (
              <div className="flex gap-2">
                <button
                  onClick={handleGrantAll}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-300 rounded-xl font-extrabold text-[10px] uppercase tracking-wider active:scale-95 transition-all"
                >
                  Grant All My Rights
                </button>
                <button
                  onClick={handleRemoveAll}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-300 rounded-xl font-extrabold text-[10px] uppercase tracking-wider active:scale-95 transition-all"
                >
                  Remove All
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/20 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850">
                  <th className="p-4 w-12 text-center">Select</th>
                  <th className="p-4">Module Name</th>
                  {ACTIONS.map(act => (
                    <th key={act} className="p-4 text-center">{act}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-semibold text-slate-655">
                {allowedModules.map(mod => (
                  <tr key={mod} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="p-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={isModuleAllChecked(mod)}
                        disabled={isLoading || (checkerEnabled && userMatrixStatus === "PENDING")}
                        onChange={() => handleToggleModuleAll(mod)}
                        className="rounded border-slate-300 bg-slate-50 text-indigo-650 focus:ring-indigo-650 cursor-pointer"
                      />
                    </td>
                    <td className="p-4 font-bold text-slate-850 dark:text-slate-200">{mod}</td>
                    {ACTIONS.map(act => {
                      const isOwner = possessPermission(mod, act);
                      const isCheckedValue = isChecked(mod, act);
                      return (
                        <td key={act} className="p-4 text-center">
                          {isOwner ? (
                            <input
                              type="checkbox"
                              checked={isCheckedValue}
                              disabled={isLoading || (checkerEnabled && userMatrixStatus === "PENDING")}
                              onChange={() => handleToggle(mod, act)}
                              className="rounded border-slate-300 bg-slate-50 text-indigo-650 focus:ring-indigo-650 cursor-pointer"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-300 dark:text-slate-750 font-bold" title="You do not possess this right">
                              -
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action buttons */}
          {(!checkerEnabled || userMatrixStatus !== "PENDING") && (
            <div className="p-6 bg-slate-50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-850 flex justify-end gap-3">
              {checkerEnabled && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSaveOrSubmit("DRAFT")}
                  className="px-5 py-3 border border-indigo-650 text-indigo-650 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-2xl font-bold text-xs active:scale-95 transition-all"
                >
                  Save Draft Matrix
                </button>
              )}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleSaveOrSubmit("PENDING")}
                className="px-5 py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-indigo-650/25 active:scale-95 transition-all flex items-center gap-1.5"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  checkerEnabled ? <Send className="w-4 h-4" /> : <Save className="w-4 h-4" />
                )}
                {checkerEnabled ? "Submit Matrix Confirmation" : "Save & Activate Matrix"}
              </button>
            </div>
          )}

        </div>
      ) : (
        selectedUserId && (
          <div className="bg-slate-50 dark:bg-slate-900 border p-8 rounded-3xl text-center text-slate-400 font-bold">
            No assignable modules. Ensure the Super Admin has assigned modular access rights to your account.
          </div>
        )
      )}

    </div>
  );
}
