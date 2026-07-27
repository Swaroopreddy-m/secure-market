"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, AlertCircle, ShoppingBag, Building2 } from "lucide-react";

interface UserFormProps {
  initialData?: {
    id: string;
    employeeId: string | null;
    username: string | null;
    name: string | null;
    email: string | null;
    role: string;
    department: string | null;
    status: string;
    assignedProducts: { id: string }[];
    assignedCustomers: { id: string }[];
  } | null;
  allRoles: { id: string; name: string }[];
  allProducts: { id: string; name: string; code: string }[];
  allCustomers: { id: string; companyName: string; customerId: string }[];
}

export default function UserForm({
  initialData,
  allRoles,
  allProducts,
  allCustomers
}: UserFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    employeeId: initialData?.employeeId || "",
    username: initialData?.username || "",
    name: initialData?.name || "",
    email: initialData?.email || "",
    password: "", // Handled server-side if provided
    role: initialData?.role || "USER",
    department: initialData?.department || "",
    status: initialData?.status || "ACTIVE",
    productIds: initialData?.assignedProducts.map(p => p.id) || [] as string[],
    customerIds: initialData?.assignedCustomers.map(c => c.id) || [] as string[]
  });

  const handleProductCheckbox = (productId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({ ...prev, productIds: [...prev.productIds, productId] }));
    } else {
      setFormData(prev => ({ ...prev, productIds: prev.productIds.filter(id => id !== productId) }));
    }
  };

  const handleCustomerCheckbox = (customerId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({ ...prev, customerIds: [...prev.customerIds, customerId] }));
    } else {
      setFormData(prev => ({ ...prev, customerIds: prev.customerIds.filter(id => id !== customerId) }));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url = initialData 
        ? `/api/saas-users/${initialData.id}` 
        : "/api/saas-users";
      
      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save user account");
      }

      router.push("/admin/users");
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
          <div className="w-1.5 h-6 bg-indigo-600 dark:bg-indigo-500 rounded-full" /> User Credentials & Role
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Full Name</label>
            <input
              required
              type="text"
              placeholder="e.g. Alice Developer"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Employee ID</label>
            <input
              required
              type="text"
              placeholder="e.g. EMP-02"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value.toUpperCase() })}
              className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-mono font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Username</label>
            <input
              required
              type="text"
              placeholder="e.g. alice_dev"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Email Address</label>
            <input
              required
              type="email"
              placeholder="alice@securemarket.local"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Password {initialData && "(Leave blank to keep unchanged)"}
            </label>
            <input
              type="password"
              placeholder="••••••••"
              required={!initialData}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold appearance-none"
            >
              {allRoles.map((r) => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Department</label>
            <input
              type="text"
              placeholder="e.g. Engineering"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold appearance-none"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="LOCKED">LOCKED</option>
            </select>
          </div>
        </div>

        {/* Assigned Scopes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100 dark:border-slate-800/50">
          
          {/* Products Multi-select */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-indigo-500" /> Assigned SaaS Products
            </h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 max-h-48 overflow-y-auto space-y-2 bg-slate-50 dark:bg-slate-950 hide-scrollbar">
              {allProducts.map((p) => (
                <label key={p.id} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-350 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={formData.productIds.includes(p.id)}
                    onChange={(e) => handleProductCheckbox(p.id, e.target.checked)}
                    className="rounded border-slate-350 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{p.name} <span className="text-[10px] text-slate-400 font-mono">({p.code})</span></span>
                </label>
              ))}
              {allProducts.length === 0 && (
                <p className="text-[10px] text-slate-400 italic">No products available</p>
              )}
            </div>
          </div>

          {/* Customers Multi-select */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-500" /> Assigned Customers / Tenants
            </h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 max-h-48 overflow-y-auto space-y-2 bg-slate-50 dark:bg-slate-950 hide-scrollbar">
              {allCustomers.map((c) => (
                <label key={c.id} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-355 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={formData.customerIds.includes(c.id)}
                    onChange={(e) => handleCustomerCheckbox(c.id, e.target.checked)}
                    className="rounded border-slate-350 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{c.companyName} <span className="text-[10px] text-slate-400 font-mono">({c.customerId})</span></span>
                </label>
              ))}
              {allCustomers.length === 0 && (
                <p className="text-[10px] text-slate-400 italic">No customers available</p>
              )}
            </div>
          </div>

        </div>

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
                <Save className="w-4 h-4" /> {initialData ? "Update Account" : "Create Account"}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
