"use client";

import { useState, useEffect } from "react";
import { 
  Building2, Save, Sparkles, Loader2, AlertCircle, 
  CheckCircle, Lock, ShieldAlert, Palette, Mail, Phone, MapPin, User
} from "lucide-react";

interface OrgProfile {
  id: string;
  name: string;
  code: string;
  logo: string;
  theme: string;
  status: string;
  subscription: string;
  description: string;
  owner: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  canEdit: boolean;
}

export default function OrganizationProfilePage() {
  const [profile, setProfile] = useState<OrgProfile | null>(null);
  const [formData, setFormData] = useState({
    logo: "",
    theme: "light",
    address: "",
    contactPerson: "",
    phone: "",
    email: "",
    description: ""
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/super-admin/organization-profile");
        if (!res.ok) throw new Error("Failed to load organization profile");
        const data = await res.json();
        setProfile(data);
        setFormData({
          logo: data.logo || "",
          theme: data.theme || "light",
          address: data.address || "",
          contactPerson: data.contactPerson || "",
          phone: data.phone || "",
          email: data.email || "",
          description: data.description || ""
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.canEdit) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/super-admin/organization-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile");
      }

      setSuccess("Organization Profile updated successfully!");
      setProfile(prev => prev ? { ...prev, ...formData } : null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-650" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/30 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-450 text-xs font-bold">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        No organization associated with this account.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Organization Profile</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">View subscription tiers and edit contact information and logo themes.</p>
      </div>

      {/* Security alert if edit rights are locked */}
      {!profile.canEdit && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 p-4 rounded-3xl flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-normal">
              <strong>Security Policy Enforcement:</strong> The Developer has not granted write permissions for the Organization Profile module to this account. All changes are locked.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/30 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-xs font-bold">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-955/20 border border-green-100 dark:border-green-900/30 p-4 rounded-2xl flex items-center gap-3 text-green-600 dark:text-green-400 text-xs font-bold">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Main Details Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-3">
        
        {/* Info Left Sidebar */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900/30 border-b md:border-b-0 md:border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 flex items-center justify-center font-bold text-2xl border border-indigo-100 dark:border-indigo-900/40">
              {profile.logo ? (
                <img src={profile.logo} alt="Logo" className="w-full h-full object-contain rounded-2xl" />
              ) : (
                profile.name.slice(0,2).toUpperCase()
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100 tracking-tight">{profile.name}</h3>
              <p className="text-[10px] font-mono text-slate-400 font-bold mt-0.5">Code: {profile.code}</p>
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-200/50 dark:border-slate-800/50 pt-4">
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Status</span>
              <span className="inline-block mt-1 px-2.5 py-0.5 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-200/50 rounded-full text-[9px] font-black uppercase">
                {profile.status}
              </span>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Subscription</span>
              <span className="inline-block mt-1 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-200/50 rounded-full text-[9px] font-black uppercase">
                {profile.subscription}
              </span>
            </div>
          </div>
        </div>

        {/* Input Details form */}
        <form onSubmit={handleSave} className="p-8 md:col-span-2 space-y-6">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Organization Settings</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Description */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Organization Description</label>
              <textarea
                disabled={!profile.canEdit}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Describe this organization..."
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-foreground resize-none disabled:opacity-60"
              />
            </div>

            {/* Logo URL */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Logo Image URL</label>
              <input
                type="text"
                disabled={!profile.canEdit}
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                placeholder="/images/orgs/logo.png"
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-foreground disabled:opacity-60"
              />
            </div>

            {/* Theme */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5" /> Organization Theme
              </label>
              <select
                disabled={!profile.canEdit}
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-4 text-xs font-bold focus:outline-none text-foreground disabled:opacity-60"
              >
                <option value="light">Light Theme Mode</option>
                <option value="dark">Dark Theme Mode</option>
                <option value="corporate">Corporate theme</option>
              </select>
            </div>

            {/* Contact Person */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Contact Person
              </label>
              <input
                type="text"
                disabled={!profile.canEdit}
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="Sarah Admin"
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-foreground disabled:opacity-60"
              />
            </div>

            {/* Contact Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> Contact Email
              </label>
              <input
                type="email"
                disabled={!profile.canEdit}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@acme.local"
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-foreground disabled:opacity-60"
              />
            </div>

            {/* Contact Phone */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> Contact Phone
              </label>
              <input
                type="text"
                disabled={!profile.canEdit}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 9988776655"
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-foreground disabled:opacity-60"
              />
            </div>

            {/* Address */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Address
              </label>
              <input
                type="text"
                disabled={!profile.canEdit}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="456 Market Road, Bengaluru"
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-foreground disabled:opacity-60"
              />
            </div>

          </div>

          {/* Form Actions */}
          {profile.canEdit && (
            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-650/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          )}

        </form>

      </div>

    </div>
  );
}
