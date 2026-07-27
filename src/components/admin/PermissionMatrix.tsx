"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Check, Save, Loader2, AlertCircle, RefreshCw } from "lucide-react";

interface RoleRecord {
  id: string;
  name: string;
  description: string | null;
}

interface PermissionRecord {
  id: string;
  name: string;
  module: string;
  description: string | null;
}

interface MappingRecord {
  roleId: string;
  permissionId: string;
}

interface PermissionMatrixProps {
  roles: RoleRecord[];
  permissions: PermissionRecord[];
  initialMappings: MappingRecord[];
}

export default function PermissionMatrix({
  roles,
  permissions,
  initialMappings
}: PermissionMatrixProps) {
  const router = useRouter();
  const [mappings, setMappings] = useState<MappingRecord[]>(initialMappings);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if a permission is mapped to a role
  const isChecked = (roleId: string, permissionId: string) => {
    return mappings.some(m => m.roleId === roleId && m.permissionId === permissionId);
  };

  // Toggle checkbox
  const handleToggle = (roleId: string, permissionId: string) => {
    // Developers cannot modify DEVELOPER permissions to prevent lockout
    const role = roles.find(r => r.id === roleId);
    if (role?.name === "DEVELOPER") {
      alert("Developer root permissions are protected and cannot be modified.");
      return;
    }

    setMappings(prev => {
      const exists = prev.some(m => m.roleId === roleId && m.permissionId === permissionId);
      if (exists) {
        return prev.filter(m => !(m.roleId === roleId && m.permissionId === permissionId));
      } else {
        return [...prev, { roleId, permissionId }];
      }
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/saas-permissions/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mappings })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update permissions matrix");
      }

      setSuccess("Permissions matrix updated successfully!");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Group permissions by module
  const modules = Array.from(new Set(permissions.map(p => p.module)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Role Permission Matrix (RBAC)</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Map granular permissions to core enterprise roles across all modules.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-600/10 disabled:opacity-75"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Matrix Config
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl flex items-center gap-2 text-xs font-bold">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-100 text-green-600 p-4 rounded-2xl flex items-center gap-2 text-xs font-bold">
          <Check className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Matrix Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-5 min-w-[200px]">Module & Action</th>
                {roles.map(r => (
                  <th key={r.id} className="px-6 py-5 text-center min-w-[120px]">
                    <div className="flex flex-col items-center">
                      <span className="text-slate-800 dark:text-slate-100 text-xs font-extrabold">{r.name.replace("_", " ")}</span>
                      <span className="text-[8px] text-slate-400 font-bold lowercase tracking-normal mt-0.5 max-w-[110px] truncate">{r.description}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-150 dark:divide-slate-850">
              {modules.map((modName) => {
                const modPerms = permissions.filter(p => p.module === modName);
                return (
                  <div key={modName} className="contents">
                    {/* Module Separator Row */}
                    <tr className="bg-slate-50/50 dark:bg-slate-900/20 font-extrabold text-[10px] uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                      <td colSpan={roles.length + 1} className="px-6 py-2.5 border-b border-slate-100 dark:border-slate-800/80">
                        {modName} MODULE
                      </td>
                    </tr>
                    
                    {modPerms.map((perm) => (
                      <tr key={perm.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-700 dark:text-slate-350">{perm.name}</div>
                          <div className="text-[9px] text-slate-400 font-medium leading-normal mt-0.5">{perm.description}</div>
                        </td>
                        {roles.map((role) => {
                          const checked = isChecked(role.id, perm.id);
                          const isDev = role.name === "DEVELOPER";
                          
                          return (
                            <td key={role.id} className="px-6 py-4 text-center">
                              <label className="inline-flex items-center justify-center cursor-pointer p-2">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={isDev}
                                  onChange={() => handleToggle(role.id, perm.id)}
                                  className={`rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer ${
                                    isDev ? "text-indigo-400 bg-slate-100 cursor-not-allowed opacity-80" : ""
                                  }`}
                                />
                              </label>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </div>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
