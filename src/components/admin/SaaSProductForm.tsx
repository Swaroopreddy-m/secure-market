"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, ArrowLeft, AlertCircle } from "lucide-react";

interface SaaSProductFormProps {
  initialData?: {
    id: string;
    name: string;
    code: string;
    category: string;
    description: string | null;
    version: string;
    status: string;
    owner: string;
    environment: string;
    documentationUrl: string | null;
    repositoryUrl: string | null;
    releaseNotes: string | null;
  } | null;
}

const CATEGORIES = [
  "Payments", "Cards", "ATM", "UPI", "Wallet", "POS", "Merchant Portal",
  "Mobile Banking", "Internet Banking", "Loans", "Marketplace Portal", "HRMS",
  "CRM", "CMS", "Inventory", "Billing"
];

const ENVIRONMENTS = ["DEVELOPMENT", "STAGING", "PRODUCTION"];
const STATUSES = ["ACTIVE", "INACTIVE", "ARCHIVED", "DRAFT"];

export default function SaaSProductForm({ initialData }: SaaSProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    code: initialData?.code || "",
    category: initialData?.category || CATEGORIES[0],
    description: initialData?.description || "",
    version: initialData?.version || "1.0.0",
    status: initialData?.status || STATUSES[0],
    owner: initialData?.owner || "",
    environment: initialData?.environment || ENVIRONMENTS[2],
    documentationUrl: initialData?.documentationUrl || "",
    repositoryUrl: initialData?.repositoryUrl || "",
    releaseNotes: initialData?.releaseNotes || "",
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url = initialData 
        ? `/api/saas-products/${initialData.id}` 
        : "/api/saas-products";
      
      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save product module");
      }

      router.push("/admin/products");
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
        <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <div className="w-1.5 h-6 bg-indigo-600 dark:bg-indigo-500 rounded-full" /> Module Specifications
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Product Name</label>
            <input
              required
              type="text"
              placeholder="e.g. Payments Gateway"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Product Code (Unique)</label>
            <input
              required
              type="text"
              placeholder="e.g. PAY-01"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-mono font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold appearance-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Owner (Engineering Lead/Team)</label>
            <input
              required
              type="text"
              placeholder="e.g. Core Fintech Team"
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Version</label>
            <input
              required
              type="text"
              placeholder="e.g. 1.0.0"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-mono font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Deploy Environment</label>
            <select
              value={formData.environment}
              onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold appearance-none"
            >
              {ENVIRONMENTS.map((env) => (
                <option key={env} value={env}>{env}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Release Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold appearance-none"
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Documentation URL</label>
            <input
              type="url"
              placeholder="https://docs.securemarket.local/..."
              value={formData.documentationUrl}
              onChange={(e) => setFormData({ ...formData, documentationUrl: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Repository URL</label>
            <input
              type="url"
              placeholder="https://github.com/securemarket/..."
              value={formData.repositoryUrl}
              onChange={(e) => setFormData({ ...formData, repositoryUrl: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-mono font-bold"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Description</label>
            <textarea
              rows={3}
              placeholder="Provide a summary of the product function and deployment targets..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-medium"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Release Notes / Changelog</label>
            <textarea
              rows={3}
              placeholder="Specify initial release features or patch notes..."
              value={formData.releaseNotes}
              onChange={(e) => setFormData({ ...formData, releaseNotes: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-medium"
            />
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-xs font-bold">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => router.back()}
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-3 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-xs transition-colors flex items-center justify-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 text-xs transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> {initialData ? "Update SaaS Module" : "Deploy SaaS Module"}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
