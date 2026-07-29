"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, AlertCircle, Building2, User, Key, Globe, Eye, EyeOff } from "lucide-react";

interface OrganizationFormProps {
  initialData?: {
    id: string;
    name: string;
    code: string;
    logo: string | null;
    description: string | null;
    subscription: string;
    theme: string;
    status: string;
    owner: string | null;
    expiryDate: Date | string | null;
    domain: string | null;
    type?: string | null;
    remarks?: string | null;
  } | null;
}

const SUBSCRIPTIONS = ["FREE", "PRO", "ENTERPRISE", "UNLIMITED"];
const THEMES = ["light", "dark", "system"];
const STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED", "DEACTIVATED"];
const ORGANIZATION_TYPES = [
  "Vegetable Market",
  "Shopping Mall",
  "Cinema Hall",
  "Hospital",
  "Restaurant",
  "Medical Store",
  "School ERP",
  "Bank",
  "Retail Store",
  "Warehouse"
];

export default function OrganizationForm({ initialData }: OrganizationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const formatInitialDate = (dateVal: any) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    return d.toISOString().split("T")[0];
  };

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    code: initialData?.code || "",
    logo: initialData?.logo || "",
    description: initialData?.description || "",
    subscription: initialData?.subscription || "FREE",
    theme: initialData?.theme || "light",
    status: initialData?.status || "ACTIVE",
    owner: initialData?.owner || "",
    expiryDate: formatInitialDate(initialData?.expiryDate),
    domain: initialData?.domain || "",
    type: initialData?.type || "Retail Store",
    remarks: initialData?.remarks || "",

    // Super Admin details (only used during creation)
    adminEmployeeId: "",
    adminUsername: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url = initialData 
        ? `/api/organizations/${initialData.id}` 
        : "/api/organizations";
      
      const method = initialData ? "PATCH" : "POST";

      // Auto-generate code from name if left empty
      let codeValue = formData.code.trim();
      if (!codeValue && formData.name) {
        codeValue = formData.name.toUpperCase().replace(/[^A-Z0-9]/g, "-").replace(/-+/g, "-");
      }

      const payload = { ...formData, code: codeValue };
      
      // If editing, we do not send blank admin credentials
      if (initialData) {
        delete (payload as any).adminEmployeeId;
        delete (payload as any).adminUsername;
        delete (payload as any).adminName;
        delete (payload as any).adminEmail;
        delete (payload as any).adminPassword;
      }

      const res = await fetch(url, {
        method,
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save organization");
      }

      router.push("/admin/organizations");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-6">
        
        {/* Section 1: Org Details */}
        <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-650" />
          <div className="w-1.5 h-6 bg-indigo-600 dark:bg-indigo-500 rounded-full" /> Organization Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Organization Name</label>
            <input
              required
              type="text"
              placeholder="e.g. Groceries Market"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Organization Code (Unique)</label>
            <input
              required
              disabled={!!initialData}
              type="text"
              placeholder="e.g. GROC-MARKET"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, "-") })}
              className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-mono font-bold text-foreground disabled:opacity-60"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Domain Slug / URL (Optional)</label>
            <input
              type="text"
              placeholder="e.g. groceries.securemarket.local"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value.toLowerCase().trim() })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Logo Image Path (Optional)</label>
            <input
              type="text"
              placeholder="e.g. /images/orgs/groceries.png"
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Subscription Tier</label>
            <select
              value={formData.subscription}
              onChange={(e) => setFormData({ ...formData, subscription: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold appearance-none text-foreground"
            >
              {SUBSCRIPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Theme Preference</label>
            <select
              value={formData.theme}
              onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold appearance-none text-foreground"
            >
              {THEMES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold appearance-none text-foreground"
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Owner Name / Contact</label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Expiry Date</label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Organization Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold appearance-none text-foreground"
            >
              {ORGANIZATION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2 col-span-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Remarks</label>
            <input
              type="text"
              placeholder="e.g. Primary retail store branch setup"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-foreground"
            />
          </div>

          <div className="col-span-1 md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Organization Description</label>
            <textarea
              rows={3}
              placeholder="Provide a short description of the business scope."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-foreground resize-none"
            />
          </div>
        </div>

        {/* Section 2: Super Admin Details (Create only) */}
        {!initialData && (
          <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800/80">
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-650" />
              <div className="w-1.5 h-6 bg-indigo-600 dark:bg-indigo-500 rounded-full" /> Provision Super Admin Credentials
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Super Admin Full Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Alice Admin"
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-foreground"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Admin Username</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. alice_admin"
                  value={formData.adminUsername}
                  onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-foreground"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Admin Email Address</label>
                <input
                  required
                  type="email"
                  placeholder="alice@domain.com"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value.toLowerCase().trim() })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-foreground"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Admin Employee ID</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. SAD-002"
                  value={formData.adminEmployeeId}
                  onChange={(e) => setFormData({ ...formData, adminEmployeeId: e.target.value.toUpperCase().trim() })}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-mono font-bold text-foreground"
                />
              </div>

              <div className="space-y-2 relative">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Admin Password</label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-foreground pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-655"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/30 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-xs font-bold">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => router.back()}
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-3 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-foreground transition-colors flex items-center justify-center cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-[2] bg-indigo-650 hover:bg-indigo-700 text-white py-3 rounded-2xl font-bold shadow-lg shadow-indigo-650/20 text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> {initialData ? "Update Organization" : "Provision Organization"}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
