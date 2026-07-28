"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
  const { data: session } = useSession();
  const creatorRole = session?.user?.role || "";
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedRights, setSelectedRights] = useState<string[]>(
    initialData?.department ? initialData.department.split(",").map(s => s.trim()).filter(Boolean) : []
  );

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

  // Sync selectedRights to department string field
  useEffect(() => {
    setFormData(prev => ({ ...prev, department: selectedRights.join(",") }));
  }, [selectedRights]);

  // Set default access rights when role is updated on a new form
  useEffect(() => {
    if (!initialData) {
      if (formData.role === "SUPER_ADMIN") {
        setSelectedRights(["customers", "users", "reports", "settings"]);
      } else if (formData.role === "PRODUCT_ADMIN") {
        setSelectedRights(["product-admin", "merchant-accounts"]);
      } else if (formData.role === "USER") {
        setSelectedRights(["user-dashboard", "inventory", "orders"]);
      } else {
        setSelectedRights([]);
      }
    }
  }, [formData.role, initialData]);

  // Automatically set default target role based on creation hierarchy
  useEffect(() => {
    if (!initialData && creatorRole) {
      if (creatorRole === "DEVELOPER") {
        setFormData(prev => ({ ...prev, role: "SUPER_ADMIN" }));
      } else if (creatorRole === "SUPER_ADMIN") {
        setFormData(prev => ({ ...prev, role: "PRODUCT_ADMIN" }));
      } else if (creatorRole === "PRODUCT_ADMIN") {
        setFormData(prev => ({ ...prev, role: "USER" }));
      }
    }
  }, [creatorRole, initialData]);

  const filteredRoles = allRoles.filter((r) => {
    if (creatorRole === "DEVELOPER") return r.name === "SUPER_ADMIN";
    if (creatorRole === "SUPER_ADMIN") return r.name === "PRODUCT_ADMIN" || r.name === "USER";
    if (creatorRole === "PRODUCT_ADMIN") return r.name === "USER";
    return true; // Fallback for Developer/Super Admin editing
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
              {filteredRoles.map((r) => (
                <option key={r.id} value={r.name}>{r.name.replace("_", " ")}</option>
              ))}
            </select>
          </div>


          {/* Access Rights options rendered instead of raw department input */}
          {(() => {
            const rightsOptions = formData.role === "SUPER_ADMIN" ? [
              { label: "Customers Tab", value: "customers", desc: "Access the Customers listing and creation page" },
              { label: "Create Product Admins Tab", value: "users", desc: "Access the User Management list to create Product Admins" },
              { label: "Reports Tab", value: "reports", desc: "Access business reports and audit logs" },
              { label: "Settings Tab", value: "settings", desc: "Access system-wide configurations and toggles" }
            ] : formData.role === "PRODUCT_ADMIN" ? [
              { label: "SaaS Products Catalog Tab", value: "product-admin", desc: "Access the SaaS products catalog tier list and add offerings" },
              { label: "Merchant Accounts Tab", value: "merchant-accounts", desc: "Access the registration page and list of shop merchants" }
            ] : formData.role === "USER" ? [
              { label: "Shop Dashboard Tab", value: "user-dashboard", desc: "Access overview sales metrics widgets" },
              { label: "Inventory Management Tab", value: "inventory", desc: "Add products, toggle inStock status, edit prices and images" },
              { label: "Order Fulfillment Tab", value: "orders", desc: "View and fulfill incoming customer storefront orders" }
            ] : [];

            if (rightsOptions.length === 0) return null;

            return (
              <div className="col-span-1 md:col-span-2 space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                <h4 className="font-extrabold text-xs text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                  Access Rights (Tab Permissions)
                </h4>
                <p className="text-[10px] text-slate-450 font-medium pb-2">Select which dashboard tabs and menus this user is authorized to view and interact with.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {rightsOptions.map((opt) => {
                    const isChecked = selectedRights.includes(opt.value);
                    return (
                      <label 
                        key={opt.value}
                        className={`flex items-start gap-3 p-4 border rounded-2xl cursor-pointer transition-all ${
                          isChecked 
                            ? "border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10 ring-1 ring-indigo-500" 
                            : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRights(prev => [...prev, opt.value]);
                            } else {
                              setSelectedRights(prev => prev.filter(v => v !== opt.value));
                            }
                          }}
                          className="mt-1 rounded border-slate-350 text-indigo-655 focus:ring-indigo-500"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{opt.label}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 leading-normal">{opt.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })()}

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
