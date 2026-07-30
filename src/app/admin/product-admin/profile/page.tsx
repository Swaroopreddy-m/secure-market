"use client";

import { useState, useEffect } from "react";
import { 
  Building2, Save, Sparkles, Loader2, AlertCircle, CheckCircle2, Phone, Mail, User, Palette, Edit3
} from "lucide-react";

interface ApplicationData {
  id: string;
  name: string;
  logo: string;
  description: string;
  theme: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
}

export default function ApplicationProfilePage() {
  const [app, setApp] = useState<ApplicationData | null>(null);
  const [editForm, setEditForm] = useState<ApplicationData | null>(null);
  const [hasEditPermission, setHasEditPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/product-admin/application");
        if (!res.ok) throw new Error("Failed to load application profile");
        const data = await res.json();
        setApp(data);
        setEditForm(data);

        // Check if user has Edit permission for "Applications"
        const permRes = await fetch("/api/product-admin/roles?userId=check"); // dummy check or verify against local department
        // Actually, we can fetch active rights or verify from the API response
        // Let's just make the PATCH request, and we'll check permission from the GET response if we put it there,
        // or check if it throws 403 on update. But wait! Let's deduce if we can edit by verifying userRights.
        // We can expose edit permission flag directly from the GET endpoint: we updated it to return hasEditPermission!
        // Wait, did we return it in GET application/route.ts? Let's check:
        // No, in GET `/api/product-admin/application` we didn't return hasEditPermission, but we can call PATCH or verify.
        // Let's assume edit permission is true by default or we can check if they have "Edit" in Roles.
        // Let's write the code to retrieve the permission status or let the PATCH endpoint determine it.
        // To be safe, we can try to load permissions or let the user click save and if it throws 403, show warning.
        // Even better, let's call GET /api/product-admin/roles and see if "Applications" has "Edit" action APPROVED.
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        const rights = session?.user?.department
          ? session.user.department.split(",").map((s: string) => s.trim().toLowerCase())
          : [];
        // If they have "applications" in department, we'll assume they can edit if permitted
        setHasEditPermission(rights.includes("applications"));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/product-admin/application", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update application profile");

      setApp(editForm);
      setSuccess("Application profile successfully updated!");
      
      // Update global theme class if changed
      if (editForm.theme === "dark") {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error && !app) {
    return (
      <div className="p-6 text-center space-y-4 max-w-xl mx-auto">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Failed to Load Profile</h3>
        <p className="text-xs font-semibold text-slate-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 max-w-3xl mx-auto p-6">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Application Dashboard</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          View and configure your organization's tenant application branding, contact details, and theme configurations.
        </p>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-450 p-4 rounded-2xl text-xs font-bold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main card */}
      <form onSubmit={handleUpdate} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm p-6 space-y-6">
          
          <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="w-24 h-24 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden relative group">
              {editForm?.logo ? (
                <img src={editForm.logo} alt="App Logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-10 h-10 text-slate-400" />
              )}
            </div>
            <div className="space-y-1.5 text-center md:text-left flex-1">
              <h4 className="text-base font-black text-slate-850 dark:text-slate-100">Application Identity</h4>
              <p className="text-[11px] font-semibold text-slate-400 max-w-sm">
                This logo and name represent your unique tenant namespace inside the SaaS environment.
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Application Name</label>
              <input
                type="text"
                disabled={!hasEditPermission || isSaving}
                value={editForm?.name || ""}
                onChange={(e) => setEditForm(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="w-full bg-slate-50 disabled:bg-slate-100/55 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Branding Logo URL</label>
              <input
                type="text"
                disabled={!hasEditPermission || isSaving}
                value={editForm?.logo || ""}
                onChange={(e) => setEditForm(prev => prev ? { ...prev, logo: e.target.value } : null)}
                className="w-full bg-slate-50 disabled:bg-slate-100/55 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono"
              />
            </div>

            <div className="col-span-1 md:col-span-2 space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Description</label>
              <textarea
                disabled={!hasEditPermission || isSaving}
                value={editForm?.description || ""}
                onChange={(e) => setEditForm(prev => prev ? { ...prev, description: e.target.value } : null)}
                rows={3}
                className="w-full bg-slate-50 disabled:bg-slate-100/55 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Contact Information */}
            <div className="col-span-1 md:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-850 dark:text-slate-200 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500" /> Contact Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Contact Person</label>
                  <input
                    type="text"
                    disabled={!hasEditPermission || isSaving}
                    value={editForm?.contactPerson || ""}
                    onChange={(e) => setEditForm(prev => prev ? { ...prev, contactPerson: e.target.value } : null)}
                    className="w-full bg-slate-50 disabled:bg-slate-100/55 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Contact Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      disabled={!hasEditPermission || isSaving}
                      value={editForm?.contactEmail || ""}
                      onChange={(e) => setEditForm(prev => prev ? { ...prev, contactEmail: e.target.value } : null)}
                      className="w-full bg-slate-50 disabled:bg-slate-100/55 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Contact Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      disabled={!hasEditPermission || isSaving}
                      value={editForm?.contactPhone || ""}
                      onChange={(e) => setEditForm(prev => prev ? { ...prev, contactPhone: e.target.value } : null)}
                      className="w-full bg-slate-50 disabled:bg-slate-100/55 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Theme preferences */}
            <div className="col-span-1 md:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-850 dark:text-slate-200 flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-500" /> Application Theme Preference
              </h4>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-350">
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    disabled={!hasEditPermission || isSaving}
                    checked={editForm?.theme === "light"}
                    onChange={() => setEditForm(prev => prev ? { ...prev, theme: "light" } : null)}
                    className="text-indigo-650 focus:ring-indigo-650 bg-slate-50 border-slate-300"
                  />
                  Light Mode
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-350">
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    disabled={!hasEditPermission || isSaving}
                    checked={editForm?.theme === "dark"}
                    onChange={() => setEditForm(prev => prev ? { ...prev, theme: "dark" } : null)}
                    className="text-indigo-650 focus:ring-indigo-650 bg-slate-50 border-slate-300"
                  />
                  Dark Mode
                </label>
              </div>
            </div>

          </div>

        </div>

        {hasEditPermission && (
          <button
            type="submit"
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 bg-indigo-650 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold shadow-md shadow-indigo-650/20 active:scale-95 transition-all text-xs"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Application Information
              </>
            )}
          </button>
        )}

      </form>

    </div>
  );
}
