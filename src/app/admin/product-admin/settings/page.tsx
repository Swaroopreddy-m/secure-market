"use client";

import { useState, useEffect } from "react";
import { 
  Settings, Save, Sparkles, Loader2, AlertCircle, CheckCircle2, ShieldAlert, Clock, AlertTriangle
} from "lucide-react";

export default function ConfigurationsPage() {
  const [configs, setConfigs] = useState({
    MAKER_CHECKER_CHECKER_ENABLED: "true",
    MAKER_CHECKER_MAKER_ENABLED: "true",
    MAKER_CHECKER_DUAL_APPROVAL: "true",
    SESSION_AUTO_LOGOUT: "true",
    SESSION_TIMEOUT_MINUTES: "15",
    SESSION_WARNING_POPUP: "true",
    SESSION_WARNING_BEFORE_TIMEOUT_MINUTES: "1"
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
        setConfigs(prev => ({
          ...prev,
          ...data
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

    // Validations
    const timeoutMin = parseInt(configs.SESSION_TIMEOUT_MINUTES);
    const warningMin = parseInt(configs.SESSION_WARNING_BEFORE_TIMEOUT_MINUTES);

    if (isNaN(timeoutMin) || timeoutMin <= 0) {
      setError("Session Timeout Limit must be a positive integer.");
      setIsSaving(false);
      return;
    }

    if (isNaN(warningMin) || warningMin < 0 || warningMin >= timeoutMin) {
      setError("Warning Threshold must be positive and less than the Session Timeout Limit.");
      setIsSaving(false);
      return;
    }

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
          Configure multi-tenant workflow controls, Maker-Checker overrides, and automated session inactivity parameters.
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

          <div className="space-y-4">
            
            {/* Checker Toggle */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">Enable Checker Workflow</h4>
                <p className="text-[11px] font-semibold text-slate-400 max-w-md mt-0.5">
                  If disabled, checker tabs are hidden. Maker creations & roles matrices are auto-approved directly on submission.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={configs.MAKER_CHECKER_CHECKER_ENABLED === "true"}
                  onChange={(e) => handleChange("MAKER_CHECKER_CHECKER_ENABLED", e.target.checked ? "true" : "false")}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Maker Toggle */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-850">
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">Enable Maker Workflow</h4>
                <p className="text-[11px] font-semibold text-slate-400 max-w-md mt-0.5">
                  If enabled, creators must submit merchant actions for secondary confirmation before system updates.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={configs.MAKER_CHECKER_MAKER_ENABLED === "true"}
                  onChange={(e) => handleChange("MAKER_CHECKER_MAKER_ENABLED", e.target.checked ? "true" : "false")}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Dual Approval (Maker-Checker lock) */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-855">
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">Dual Approval Rule Enforcement</h4>
                <p className="text-[11px] font-semibold text-slate-400 max-w-md mt-0.5">
                  Enforces secondary verification. Under dual approval, the Maker username cannot approve their own submissions.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={configs.MAKER_CHECKER_DUAL_APPROVAL === "true"}
                  onChange={(e) => handleChange("MAKER_CHECKER_DUAL_APPROVAL", e.target.checked ? "true" : "false")}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>

          </div>
        </div>

        {/* Session Inactivity Timeout Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 space-y-6">
          <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-200 border-b pb-3 border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" /> Automated Inactivity Session Parameters
          </h3>

          <div className="space-y-4">
            
            {/* Auto Logout Toggle */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">Inactivity Auto-Logout</h4>
                <p className="text-[11px] font-semibold text-slate-400 max-w-md mt-0.5">
                  Track client keystrokes and scroll movements. Log out user automatically if inactivity exceeds limit.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={configs.SESSION_AUTO_LOGOUT === "true"}
                  onChange={(e) => handleChange("SESSION_AUTO_LOGOUT", e.target.checked ? "true" : "false")}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Inactivity warning popup toggle */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-850">
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">Display Impending Timeout Warnings</h4>
                <p className="text-[11px] font-semibold text-slate-400 max-w-md mt-0.5">
                  Present a modal reminder box allowing the operator to click "Stay Logged In" before automatic session closure.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={configs.SESSION_WARNING_POPUP === "true"}
                  onChange={(e) => handleChange("SESSION_WARNING_POPUP", e.target.checked ? "true" : "false")}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Integer inputs row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-850">
              
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Session Timeout Limit (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  required
                  disabled={configs.SESSION_AUTO_LOGOUT !== "true"}
                  value={configs.SESSION_TIMEOUT_MINUTES}
                  onChange={(e) => handleChange("SESSION_TIMEOUT_MINUTES", e.target.value)}
                  className="w-full bg-slate-50 disabled:bg-slate-100/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Show Warning Popup Before (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  required
                  disabled={configs.SESSION_WARNING_POPUP !== "true" || configs.SESSION_AUTO_LOGOUT !== "true"}
                  value={configs.SESSION_WARNING_BEFORE_TIMEOUT_MINUTES}
                  onChange={(e) => handleChange("SESSION_WARNING_BEFORE_TIMEOUT_MINUTES", e.target.value)}
                  className="w-full bg-slate-50 disabled:bg-slate-100/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
                />
              </div>

            </div>

          </div>
        </div>

        {/* Warning notification */}
        <div className="bg-amber-50 border border-amber-250/30 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400 p-4 rounded-3xl text-xs font-semibold flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" />
          <div>
            <strong className="block font-bold">Important Notice</strong>
            Updating security settings will commit updates directly to the systems configurations table. Layout views & route maps will immediately sync.
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
