"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  ShoppingBag, Users, Plus, Loader2, CheckCircle, 
  AlertCircle, Sparkles, FolderPlus, UserPlus, ClipboardList,
  AppWindow, Edit, Trash2, Settings
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  description: string | null;
  version: string;
  status: string;
  owner: string;
  environment: string;
}

interface UserRecord {
  id: string;
  employeeId: string | null;
  username: string | null;
  name: string | null;
  email: string | null;
  status: string;
  department: string | null;
  applicationId?: string | null;
}

interface ApplicationRecord {
  id: string;
  name: string;
  logo: string;
  description: string | null;
  settings: string | null;
  createdAt: string | Date;
}

interface ProductAdminTabsProps {
  initialProducts: Product[];
  initialMerchants: UserRecord[];
  allCustomers: { id: string; companyName: string; customerId: string }[];
  initialApplications?: ApplicationRecord[];
}

export default function ProductAdminTabs({
  initialProducts,
  initialMerchants,
  allCustomers,
  initialApplications = []
}: ProductAdminTabsProps) {
  const router = useRouter();
  const { data: session } = useSession();
  
  const userRights = session?.user?.department
    ? session.user.department.split(",").map((s: string) => s.trim().toLowerCase())
    : [];
  const isDevOrSuper = session?.user?.role === "DEVELOPER" || session?.user?.role === "SUPER_ADMIN";

  const showProductsTab = isDevOrSuper || userRights.includes("product-admin");
  const showMerchantsTab = isDevOrSuper || userRights.includes("merchant-accounts");

  const [activeTab, setActiveTab] = useState<"applications" | "products" | "merchants">("applications");

  // Sync activeTab on session load
  useEffect(() => {
    if (session?.user) {
      const rights = session.user.department
        ? session.user.department.split(",").map((s: string) => s.trim().toLowerCase())
        : [];
      const devSuper = session.user.role === "DEVELOPER" || session.user.role === "SUPER_ADMIN";
      const hasProducts = devSuper || rights.includes("product-admin");
      const hasMerchants = devSuper || rights.includes("merchant-accounts");

      if (!hasProducts && hasMerchants) {
        setActiveTab("merchants");
      } else {
        setActiveTab("applications");
      }
    }
  }, [session]);
  
  // Applications states
  const [applications, setApplications] = useState<ApplicationRecord[]>(initialApplications);
  const [isAddingApplication, setIsAddingApplication] = useState(false);
  const [appForm, setAppForm] = useState({
    name: "",
    logo: "/images/apps/default.png",
    description: "",
    settings: "{}"
  });

  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [editAppForm, setEditAppForm] = useState({
    name: "",
    logo: "",
    description: "",
    settings: ""
  });

  // Products states
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    code: "",
    category: "Marketplace Portal",
    description: "",
    version: "1.0.0",
    status: "ACTIVE",
    owner: "Market Team",
    environment: "PRODUCTION"
  });

  // Merchants states
  const [merchants, setMerchants] = useState<UserRecord[]>(initialMerchants);
  const [isAddingMerchant, setIsAddingMerchant] = useState(false);
  const [selectedMerchantRights, setSelectedMerchantRights] = useState<string[]>([
    "user-dashboard", "inventory", "orders"
  ]);
  const [merchantForm, setMerchantForm] = useState({
    name: "",
    employeeId: "",
    username: "",
    email: "",
    password: "",
    role: "USER",
    department: "Shops",
    status: "ACTIVE",
    productIds: [] as string[],
    customerIds: [] as string[],
    applicationId: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Handle Application Submit
  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appForm)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create application");
      }
      const newApp = await res.json();
      setApplications(prev => [newApp, ...prev]);
      setSuccessMsg(`Successfully created application "${appForm.name}"!`);
      setAppForm({ name: "", logo: "/images/apps/default.png", description: "", settings: "{}" });
      setIsAddingApplication(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Edit Application
  const startEditApplication = (app: ApplicationRecord) => {
    setEditingAppId(app.id);
    setEditAppForm({
      name: app.name,
      logo: app.logo,
      description: app.description || "",
      settings: app.settings || "{}"
    });
  };

  const handleEditApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppId) return;
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/applications/${editingAppId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editAppForm)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update application");
      }
      const updated = await res.json();
      setApplications(prev => prev.map(a => a.id === editingAppId ? updated : a));
      setSuccessMsg(`Successfully updated application "${editAppForm.name}"!`);
      setEditingAppId(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Delete Application
  const handleDeleteApplication = async (appId: string) => {
    if (!confirm("Are you sure you want to delete this application? This will disconnect associated inventory items, users, and orders.")) return;
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete application");
      }
      setApplications(prev => prev.filter(a => a.id !== appId));
      setSuccessMsg("Successfully deleted application.");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Product Create
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/saas-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productForm)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create product offering");
      }

      const newProduct = await res.json();
      setProducts(prev => [newProduct, ...prev]);
      setSuccessMsg(`Successfully created product offering ${productForm.name}!`);
      setProductForm({
        name: "",
        code: "",
        category: "Marketplace Portal",
        description: "",
        version: "1.0.0",
        status: "ACTIVE",
        owner: "Market Team",
        environment: "PRODUCTION"
      });
      setIsAddingProduct(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Merchant Create
  const handleMerchantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/saas-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...merchantForm,
          department: selectedMerchantRights.join(",")
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create merchant user");
      }

      const newUser = await res.json();
      setMerchants(prev => [
        {
          id: newUser.id,
          employeeId: merchantForm.employeeId,
          username: newUser.username,
          name: merchantForm.name,
          email: merchantForm.email,
          status: merchantForm.status,
          department: selectedMerchantRights.join(","),
          applicationId: merchantForm.applicationId
        },
        ...prev
      ]);

      setSuccessMsg(`Successfully created merchant account ${merchantForm.name}!`);
      setMerchantForm({
        name: "",
        employeeId: "",
        username: "",
        email: "",
        password: "",
        role: "USER",
        department: "Shops",
        status: "ACTIVE",
        productIds: [],
        customerIds: [],
        applicationId: ""
      });
      setSelectedMerchantRights(["user-dashboard", "inventory", "orders"]);
      setIsAddingMerchant(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert panels */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 dark:bg-rose-955/20 dark:border-rose-900/30 text-rose-650 dark:text-rose-400 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 dark:bg-emerald-955/20 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs list */}
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-px">
        <button
          onClick={() => { setActiveTab("applications"); setError(null); setSuccessMsg(null); }}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs transition-all tracking-wide ${
            activeTab === "applications"
              ? "border-indigo-650 text-indigo-750 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <AppWindow className="w-4 h-4" /> Marketplace Applications
        </button>

        {showProductsTab && (
          <button
            onClick={() => { setActiveTab("products"); setError(null); setSuccessMsg(null); }}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs transition-all tracking-wide ${
              activeTab === "products"
                ? "border-indigo-650 text-indigo-750 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Products Catalog
          </button>
        )}

        {showMerchantsTab && (
          <button
            onClick={() => { setActiveTab("merchants"); setError(null); setSuccessMsg(null); }}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs transition-all tracking-wide ${
              activeTab === "merchants"
                ? "border-indigo-650 text-indigo-750 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Users className="w-4 h-4" /> Merchant Accounts
          </button>
        )}
      </div>

      {/* Tab 1: Marketplace Applications */}
      {activeTab === "applications" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">Marketplace Applications</h3>
            <button
              onClick={() => {
                setEditingAppId(null);
                setIsAddingApplication(!isAddingApplication);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all active:scale-95 shadow-sm"
            >
              {isAddingApplication ? "Cancel Form" : <><Plus className="w-4 h-4" /> Add Application</>}
            </button>
          </div>

          {/* Add / Edit Application Form */}
          {(isAddingApplication || editingAppId) && (
            <form 
              onSubmit={editingAppId ? handleEditApplicationSubmit : handleApplicationSubmit} 
              className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 p-6 rounded-3xl space-y-4 animate-in fade-in duration-300"
            >
              <h4 className="font-extrabold text-xs text-indigo-600 flex items-center gap-1.5">
                <AppWindow className="w-4 h-4" /> 
                {editingAppId ? `Edit Application: ${editAppForm.name}` : "Create Marketplace Application"}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Application Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Vegetable Market, Electronics App"
                    value={editingAppId ? editAppForm.name : appForm.name}
                    onChange={(e) => {
                      if (editingAppId) setEditAppForm({ ...editAppForm, name: e.target.value });
                      else setAppForm({ ...appForm, name: e.target.value });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logo URL / Icon Path</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. /images/apps/veg.png"
                    value={editingAppId ? editAppForm.logo : appForm.logo}
                    onChange={(e) => {
                      if (editingAppId) setEditAppForm({ ...editAppForm, logo: e.target.value });
                      else setAppForm({ ...appForm, logo: e.target.value });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-955 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                  <input
                    type="text"
                    placeholder="Describe this app e.g. Buy fresh vegetables online"
                    value={editingAppId ? editAppForm.description : appForm.description}
                    onChange={(e) => {
                      if (editingAppId) setEditAppForm({ ...editAppForm, description: e.target.value });
                      else setAppForm({ ...appForm, description: e.target.value });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settings JSON Configuration</label>
                  <input
                    type="text"
                    placeholder='e.g. {"theme": "green", "allowGuest": true}'
                    value={editingAppId ? editAppForm.settings : appForm.settings}
                    onChange={(e) => {
                      if (editingAppId) setEditAppForm({ ...editAppForm, settings: e.target.value });
                      else setAppForm({ ...appForm, settings: e.target.value });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-955 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingAppId ? "Save Modifications" : "Create Marketplace Application"}
                </button>
                {editingAppId && (
                  <button
                    type="button"
                    onClick={() => setEditingAppId(null)}
                    className="px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-2.5 rounded-xl font-bold text-xs"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Applications Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {applications.map((app) => (
              <div 
                key={app.id} 
                className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl shadow-sm flex flex-col justify-between hover:border-indigo-200 dark:hover:border-indigo-950 transition-all group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center text-xl shadow-inner font-bold text-indigo-650">
                      {app.logo ? <img src={app.logo} alt={app.name} className="w-7 h-7 object-contain error-fallback" onError={(e) => { (e.target as any).style.display = 'none' }} /> : "App"}
                      <span className="group-hover:scale-110 transition-transform">🏪</span>
                    </span>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => startEditApplication(app)}
                        className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                        title="Edit Application"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteApplication(app.id)}
                        className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-rose-605"
                        title="Delete Application"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 tracking-tight">{app.name}</h4>
                    <p className="text-[11px] text-slate-450 dark:text-slate-500 font-medium leading-relaxed mt-1">{app.description || "No description provided."}</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3 mt-4 flex items-center justify-between text-[9px] font-bold text-slate-400">
                  <span className="font-mono">ID: {app.id.slice(-8)}</span>
                  <span>Created: {new Date(app.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {applications.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 font-sans border border-dashed rounded-3xl">
                No active marketplace applications created yet. Click "Add Application" above to begin.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Products Catalog */}
      {activeTab === "products" && showProductsTab && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">SaaS Products Offerings</h3>
            <button
              onClick={() => setIsAddingProduct(!isAddingProduct)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all active:scale-95"
            >
              {isAddingProduct ? "Cancel Form" : <><Plus className="w-4 h-4" /> Add Product Offering</>}
            </button>
          </div>

          {/* Add Product Form Inline */}
          {isAddingProduct && (
            <form onSubmit={handleProductSubmit} className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 p-6 rounded-3xl space-y-4 animate-in fade-in duration-300">
              <h4 className="font-extrabold text-xs text-indigo-600 flex items-center gap-1.5"><FolderPlus className="w-4 h-4" /> Create Product Offering</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Unified Payments API"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Code</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. PAY-01"
                    value={productForm.code}
                    onChange={(e) => setProductForm({ ...productForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 dark:bg-slate-955 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
                  >
                    <option value="Marketplace Portal">Marketplace Portal</option>
                    <option value="Enterprise SaaS">Enterprise SaaS</option>
                    <option value="Developer API Tools">Developer API Tools</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                  <input
                    type="text"
                    placeholder="Brief description of product features..."
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Version</label>
                    <input
                      required
                      type="text"
                      placeholder="1.0.0"
                      value={productForm.version}
                      onChange={(e) => setProductForm({ ...productForm, version: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-955 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Env</label>
                    <select
                      value={productForm.environment}
                      onChange={(e) => setProductForm({ ...productForm, environment: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
                    >
                      <option value="PRODUCTION">PROD</option>
                      <option value="SANDBOX">SANDBOX</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                    <select
                      value={productForm.status}
                      onChange={(e) => setProductForm({ ...productForm, status: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-650 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Product Tier"}
              </button>
            </form>
          )}

          {/* Products List Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900/50">
                    <th className="p-4 px-6">Product Code & Name</th>
                    <th className="p-4 px-6">Category</th>
                    <th className="p-4 px-6">Environment</th>
                    <th className="p-4 px-6">Team Owner</th>
                    <th className="p-4 px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-800/50">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 px-6 font-bold text-slate-800 dark:text-slate-200">
                        <div>{prod.name}</div>
                        <div className="text-[9px] text-slate-400 font-mono font-medium pt-0.5">{prod.code} • v{prod.version}</div>
                      </td>
                      <td className="p-4 px-6 font-semibold text-slate-655 dark:text-slate-400">{prod.category}</td>
                      <td className="p-4 px-6">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          prod.environment === "PRODUCTION"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                        }`}>
                          {prod.environment}
                        </span>
                      </td>
                      <td className="p-4 px-6 text-slate-500 dark:text-slate-500 font-medium">{prod.owner}</td>
                      <td className="p-4 px-6 text-right">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 w-fit ml-auto">
                          {prod.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Merchant Accounts */}
      {activeTab === "merchants" && showMerchantsTab && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">Registered Shop Merchants</h3>
            <button
              onClick={() => setIsAddingMerchant(!isAddingMerchant)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all active:scale-95"
            >
              {isAddingMerchant ? "Cancel Form" : <><UserPlus className="w-4 h-4" /> Create Shop Merchant</>}
            </button>
          </div>

          {/* Add Merchant Form Inline */}
          {isAddingMerchant && (
            <form onSubmit={handleMerchantSubmit} className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 p-6 rounded-3xl space-y-4 animate-in fade-in duration-300">
              <h4 className="font-extrabold text-xs text-indigo-600 flex items-center gap-1.5"><UserPlus className="w-4 h-4" /> Create Shop Merchant Account</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Merchant/Shop Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Fresh Groceries Inc."
                    value={merchantForm.name}
                    onChange={(e) => setMerchantForm({ ...merchantForm, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Merchant ID / Code</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. MRT-02"
                    value={merchantForm.employeeId}
                    onChange={(e) => setMerchantForm({ ...merchantForm, employeeId: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 dark:bg-slate-955 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assigned Marketplace Application</label>
                  <select
                    required
                    value={merchantForm.applicationId}
                    onChange={(e) => setMerchantForm({ ...merchantForm, applicationId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <option value="">-- Select Application --</option>
                    {applications.map((app) => (
                      <option key={app.id} value={app.id}>{app.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Username</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. shop_owner_2"
                    value={merchantForm.username}
                    onChange={(e) => setMerchantForm({ ...merchantForm, username: e.target.value.toLowerCase() })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <input
                    required
                    type="email"
                    placeholder="e.g. owner@local.com"
                    value={merchantForm.email}
                    onChange={(e) => setMerchantForm({ ...merchantForm, email: e.target.value.toLowerCase() })}
                    className="w-full bg-slate-50 dark:bg-slate-955 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={merchantForm.password}
                    onChange={(e) => setMerchantForm({ ...merchantForm, password: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Assigned Products License (Required)</label>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-950 max-h-32 overflow-y-auto space-y-1">
                  {products.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={merchantForm.productIds.includes(p.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setMerchantForm(prev => ({ ...prev, productIds: [...prev.productIds, p.id] }));
                          } else {
                            setMerchantForm(prev => ({ ...prev, productIds: prev.productIds.filter(id => id !== p.id) }));
                          }
                        }}
                        className="rounded text-indigo-650"
                      />
                      <span>{p.name} <span className="text-[10px] text-slate-400">({p.code})</span></span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Access Rights (Tab Permissions)</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Shop Dashboard", value: "user-dashboard", desc: "Overview metrics widgets" },
                    { label: "Inventory Management", value: "inventory", desc: "Manage products, toggles, prices" },
                    { label: "Order Fulfillment", value: "orders", desc: "Fulfill storefront customer orders" }
                  ].map((opt) => {
                    const isChecked = selectedMerchantRights.includes(opt.value);
                    return (
                      <label 
                        key={opt.value}
                        className={`flex items-start gap-2.5 p-3 border rounded-xl cursor-pointer transition-all ${
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
                              setSelectedMerchantRights(prev => [...prev, opt.value]);
                            } else {
                              setSelectedMerchantRights(prev => prev.filter(v => v !== opt.value));
                            }
                          }}
                          className="mt-0.5 rounded text-indigo-650"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-850 dark:text-slate-200">{opt.label}</p>
                          <p className="text-[9px] text-slate-450 dark:text-slate-500 font-medium leading-tight mt-0.5">{opt.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Merchant Account"}
              </button>
            </form>
          )}

          {/* Merchants List Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900/50">
                    <th className="p-4 px-6">ID & Merchant Shop Name</th>
                    <th className="p-4 px-6">Username</th>
                    <th className="p-4 px-6">Email</th>
                    <th className="p-4 px-6">Assigned Application</th>
                    <th className="p-4 px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-800/50">
                  {merchants.map((m) => {
                    const assignedApp = applications.find(a => a.id === m.applicationId);
                    return (
                      <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="p-4 px-6 font-bold text-slate-800 dark:text-slate-200">
                          <div>{m.name}</div>
                          <div className="text-[9px] text-slate-400 font-mono font-medium pt-0.5">{m.employeeId || "MRT-N/A"}</div>
                        </td>
                        <td className="p-4 px-6 font-semibold text-slate-655 dark:text-slate-400">{m.username}</td>
                        <td className="p-4 px-6 text-slate-500 font-medium">{m.email}</td>
                        <td className="p-4 px-6 text-indigo-650 dark:text-indigo-400 font-bold">
                          {assignedApp ? assignedApp.name : "None / Global"}
                        </td>
                        <td className="p-4 px-6 text-right">
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 w-fit ml-auto">
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {merchants.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">No shop merchants created yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
