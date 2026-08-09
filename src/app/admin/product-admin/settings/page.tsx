"use client";

import { useState, useEffect } from "react";
import { 
  Settings, Save, Loader2, AlertCircle, CheckCircle2, ShieldAlert, AlertTriangle
} from "lucide-react";

export default function ConfigurationsPage() {
  const [configs, setConfigs] = useState({
    MAKER_CHECKER_CHECKER_ENABLED: "true",
    MAKER_CHECKER_DUAL_APPROVAL: "true"
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const res = await fetch("/api/product-admin/settings");
        if (!res.ok) throw new Error("Failed to load settings configuration");
        const data = await res.json();
        const configMap: any = {};
        data.forEach((c: any) => {
          configMap[c.key] = c.value;
        });
        setConfigs(prev => ({
          ...prev,
          MAKER_CHECKER_CHECKER_ENABLED: configMap.MAKER_CHECKER_CHECKER_ENABLED || "true",
          MAKER_CHECKER_DUAL_APPROVAL: configMap.MAKER_CHECKER_DUAL_APPROVAL || "true"
        }));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfigs();
  }, []);

  const handleChange = (key: string, value: string) => {
    setConfigs(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/product-admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configs)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save configuration settings");

      setSuccess("Configuration settings successfully updated. Changes are now active.");
      
      // Reload page after a delay to sync tabs/sidebar layout changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-655" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-3xl mx-auto p-6">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">System & Security Settings</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Configure multi-tenant workflow controls and Maker-Checker overrides.
        </p>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 dark:bg-rose-955/20 dark:border-rose-900/30 dark:text-rose-455 p-4 rounded-2xl text-xs font-bold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Maker-Checker Overrides Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 space-y-6">
          <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-200 border-b pb-3 border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-indigo-500" /> Maker-Checker Workflow Configuration
          </h3>

          <div className="space-y-6">
            
            {/* Maker & Checker Selection */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-850 dark:text-slate-200">Maker & Checker</h4>
                <p className="text-[11px] font-semibold text-slate-400 max-w-md mt-0.5">
                  If enabled, records will be shared to another confirm tabs for approval. If disabled, direct confirmation is applied for all users.
                </p>
              </div>
              <div className="w-full sm:w-56">
                <select
                  value={configs.MAKER_CHECKER_CHECKER_ENABLED}
                  onChange={(e) => handleChange("MAKER_CHECKER_CHECKER_ENABLED", e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value="true">ENABLE</option>
                  <option value="false">DISABLE</option>
                </select>
              </div>
            </div>

            {/* Same Maker & Checker Selection */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-slate-100 dark:border-slate-850">
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-855 dark:text-slate-200">Same Maker & Checker</h4>
                <p className="text-[11px] font-semibold text-slate-400 max-w-md mt-0.5">
                  If enabled, the same person who created or modified the record can perform the checker confirmation step.
                </p>
              </div>
              <div className="w-full sm:w-56">
                <select
                  value={configs.MAKER_CHECKER_DUAL_APPROVAL}
                  onChange={(e) => handleChange("MAKER_CHECKER_DUAL_APPROVAL", e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  {/* Note: Enable = Dual approval constraint is false (allowing same person to confirm) */}
                  <option value="false">ENABLE (Same person can confirm)</option>
                  <option value="true">DISABLE (Different person required)</option>
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* Warning notification */}
        <div className="bg-amber-50 border border-amber-250/30 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400 p-4 rounded-3xl text-xs font-semibold flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" />
          <div>
            <strong className="block font-bold">Important Notice</strong>
            Updating workflow settings will commit updates directly to the systems configurations table. Layout views & route maps will immediately sync.
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 bg-indigo-650 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold shadow-md shadow-indigo-655/25 active:scale-95 transition-all text-xs"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving System Settings...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Configuration Settings
            </>
          )}
        </button>

      </form>

    </div>
  );
}
