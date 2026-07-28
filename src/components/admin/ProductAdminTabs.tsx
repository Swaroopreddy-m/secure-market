"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  ShoppingBag, Users, Plus, Loader2, CheckCircle, 
  AlertCircle, Sparkles, FolderPlus, UserPlus, ClipboardList,
  AppWindow, Edit, Trash2, Settings, Building2, ListOrdered,
  FileText, BarChart3, Bell, Eye, Lock, ShieldCheck, Tag
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
  shopId?: string | null;
}

interface ApplicationRecord {
  id: string;
  name: string;
  logo: string;
  description: string | null;
  settings: string | null;
  createdAt: string | Date;
}

interface ShopRecord {
  id: string;
  name: string;
  logo: string;
  description: string | null;
  status: string;
  applicationId: string | null;
  createdAt: string | Date;
}

interface CategoryRecord {
  id: string;
  name: string;
  description: string | null;
}

interface StoreProductRecord {
  id: string;
  name: string;
  price: number;
  unit: string;
  category: string;
  image: string;
  inStock: boolean;
  discount: number;
  quality: string;
  description: string | null;
  stock: number;
  images: string; // JSON string
  shopId: string | null;
  applicationId: string | null;
}

interface OrderRecord {
  id: string;
  userId: string;
  totalAmount: number;
  status: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryPhone: string;
  createdAt: string | Date;
  applicationId: string | null;
  user?: {
    name: string | null;
    email: string | null;
  };
  items: {
    id: string;
    product: {
      name: string;
      price: number;
    };
    quantity: number;
    price: number;
  }[];
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

  // Active Tab State
  const [activeTab, setActiveTab] = useState<
    "applications" | "shops" | "categories" | "products" | "merchants" | "orders" | "reports" | "settings"
  >("applications");

  // Multi-tenant States
  const [applications, setApplications] = useState<ApplicationRecord[]>(initialApplications);
  const [shops, setShops] = useState<ShopRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<StoreProductRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [merchants, setMerchants] = useState<UserRecord[]>(initialMerchants);

  // Forms Toggle States
  const [isAddingApplication, setIsAddingApplication] = useState(false);
  const [isAddingShop, setIsAddingShop] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingCatalogProduct, setIsAddingCatalogProduct] = useState(false);
  const [isAddingMerchant, setIsAddingMerchant] = useState(false);

  // Form Field States
  const [appForm, setAppForm] = useState({ name: "", logo: "/images/apps/default.png", description: "", settings: "{}" });
  const [shopForm, setShopForm] = useState({ name: "", logo: "/images/shops/default.png", description: "", applicationId: "" });
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
  const [catalogProductForm, setCatalogProductForm] = useState({
    name: "", price: 0, unit: "1 kg", category: "Fresh Vegetables", image: "",
    inStock: true, discount: 0, quality: "Premium", description: "", stock: 100,
    images: "", shopId: "", applicationId: ""
  });
  
  const [merchantForm, setMerchantForm] = useState({
    name: "", employeeId: "", username: "", email: "", password: "",
    role: "USER", department: "user-dashboard,inventory,orders", status: "ACTIVE",
    productIds: [] as string[], customerIds: [] as string[], applicationId: "", shopId: ""
  });

  // Edit Toggles & Forms
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [editAppForm, setEditAppForm] = useState({ name: "", logo: "", description: "", settings: "" });

  const [editingShopId, setEditingShopId] = useState<string | null>(null);
  const [editShopForm, setEditShopForm] = useState({ name: "", logo: "", description: "", applicationId: "", status: "ACTIVE" });

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatForm, setEditCatForm] = useState({ name: "", description: "" });

  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [editProdForm, setEditProdForm] = useState({
    name: "", price: 0, unit: "1 kg", category: "Fresh Vegetables", image: "",
    inStock: true, discount: 0, quality: "Premium", description: "", stock: 100,
    images: "", shopId: "", applicationId: ""
  });

  const [selectedMerchantRights, setSelectedMerchantRights] = useState<string[]>([
    "user-dashboard", "inventory", "orders"
  ]);

  // Loading / Feedback States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync activeTab query parameter if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get("tab") as any;
      if (["applications", "shops", "categories", "products", "merchants", "orders", "reports", "settings"].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  // Fetch Shops, Categories, Products, and Orders
  const fetchData = async () => {
    try {
      const [shopsRes, catsRes, prodsRes, ordersRes] = await Promise.all([
        fetch("/api/shops").then(r => r.json()),
        fetch("/api/categories").then(r => r.json()),
        fetch("/api/products").then(r => r.json()),
        fetch("/api/orders").then(r => r.json())
      ]);

      if (Array.isArray(shopsRes)) setShops(shopsRes);
      if (Array.isArray(catsRes)) setCategories(catsRes);
      if (Array.isArray(prodsRes)) setCatalogProducts(prodsRes);
      if (Array.isArray(ordersRes)) setOrders(ordersRes);
    } catch (err) {
      console.error("Failed to load Product Admin data dependencies", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Applications CRUD handlers
  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appForm)
      });
      if (!res.ok) throw new Error("Failed to create application");
      const data = await res.json();
      setApplications(prev => [data, ...prev]);
      setSuccessMsg(`Successfully created application "${appForm.name}"!`);
      setAppForm({ name: "", logo: "/images/apps/default.png", description: "", settings: "{}" });
      setIsAddingApplication(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/applications/${editingAppId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editAppForm)
      });
      if (!res.ok) throw new Error("Failed to update application");
      const data = await res.json();
      setApplications(prev => prev.map(a => a.id === editingAppId ? data : a));
      setSuccessMsg(`Successfully updated application "${editAppForm.name}"!`);
      setEditingAppId(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteApplication = async (id: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return;
    try {
      const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete application");
      setApplications(prev => prev.filter(a => a.id !== id));
      setSuccessMsg("Successfully deleted application.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Shops CRUD handlers
  const handleShopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shopForm)
      });
      if (!res.ok) throw new Error("Failed to create shop");
      const data = await res.json();
      setShops(prev => [data, ...prev]);
      setSuccessMsg(`Successfully created shop "${shopForm.name}"!`);
      setShopForm({ name: "", logo: "/images/shops/default.png", description: "", applicationId: "" });
      setIsAddingShop(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditShopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShopId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/shops/${editingShopId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editShopForm)
      });
      if (!res.ok) throw new Error("Failed to update shop");
      const data = await res.json();
      setShops(prev => prev.map(s => s.id === editingShopId ? data : s));
      setSuccessMsg(`Successfully updated shop "${editShopForm.name}"!`);
      setEditingShopId(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteShop = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shop?")) return;
    try {
      const res = await fetch(`/api/shops/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete shop");
      setShops(prev => prev.filter(s => s.id !== id));
      setSuccessMsg("Successfully deleted shop.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Categories CRUD handlers
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryForm)
      });
      if (!res.ok) throw new Error("Failed to create category");
      const data = await res.json();
      setCategories(prev => [...prev, data]);
      setSuccessMsg(`Successfully created category "${categoryForm.name}"!`);
      setCategoryForm({ name: "", description: "" });
      setIsAddingCategory(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCatId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/categories/${editingCatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editCatForm)
      });
      if (!res.ok) throw new Error("Failed to update category");
      const data = await res.json();
      setCategories(prev => prev.map(c => c.id === editingCatId ? data : c));
      setSuccessMsg(`Successfully updated category "${editCatForm.name}"!`);
      setEditingCatId(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete category");
      setCategories(prev => prev.filter(c => c.id !== id));
      setSuccessMsg("Successfully deleted category.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Catalog Products CRUD
  const handleCatalogProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catalogProductForm)
      });
      if (!res.ok) throw new Error("Failed to create product");
      const data = await res.json();
      setCatalogProducts(prev => [data, ...prev]);
      setSuccessMsg(`Successfully created product "${catalogProductForm.name}"!`);
      setCatalogProductForm({
        name: "", price: 0, unit: "1 kg", category: "Fresh Vegetables", image: "",
        inStock: true, discount: 0, quality: "Premium", description: "", stock: 100,
        images: "", shopId: "", applicationId: ""
      });
      setIsAddingCatalogProduct(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCatalogProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProdId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/products/${editingProdId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editProdForm)
      });
      if (!res.ok) throw new Error("Failed to update product");
      const data = await res.json();
      setCatalogProducts(prev => prev.map(p => p.id === editingProdId ? data : p));
      setSuccessMsg(`Successfully updated product "${editProdForm.name}"!`);
      setEditingProdId(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCatalogProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      setCatalogProducts(prev => prev.filter(p => p.id !== id));
      setSuccessMsg("Successfully deleted product.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Merchants Account CRUD
  const handleMerchantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/saas-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...merchantForm,
          department: selectedMerchantRights.join(",")
        })
      });
      if (!res.ok) throw new Error("Failed to create merchant");
      const data = await res.json();
      setMerchants(prev => [data, ...prev]);
      setSuccessMsg(`Successfully created merchant account "${merchantForm.name}"!`);
      setMerchantForm({
        name: "", employeeId: "", username: "", email: "", password: "",
        role: "USER", department: "user-dashboard,inventory,orders", status: "ACTIVE",
        productIds: [], customerIds: [], applicationId: "", shopId: ""
      });
      setIsAddingMerchant(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUserStatus = async (user: UserRecord) => {
    const nextStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await fetch(`/api/saas-users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) throw new Error("Failed to toggle status");
      setMerchants(prev => prev.map(m => m.id === user.id ? { ...m, status: nextStatus } : m));
      setSuccessMsg(`Successfully changed merchant status to ${nextStatus}.`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleOrderUpdate = async (orderId: string, nextStatus: string) => {
    try {
      const res = await fetch(`/api/orders`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: nextStatus })
      });
      if (!res.ok) throw new Error("Failed to update order status");
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
      setSuccessMsg("Successfully updated order status.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications / Feedback */}
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

      {/* Tabs navigation list */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-100 dark:border-slate-800 pb-px hide-scrollbar">
        {[
          { id: "applications", label: "Applications", icon: AppWindow },
          { id: "shops", label: "Shops", icon: Building2 },
          { id: "categories", label: "Categories", icon: Tag },
          { id: "products", label: "Products Catalog", icon: ShoppingBag },
          { id: "merchants", label: "Merchant Users", icon: Users },
          { id: "orders", label: "Orders", icon: ListOrdered },
          { id: "reports", label: "Analytics & Reports", icon: BarChart3 },
          { id: "settings", label: "Settings", icon: Settings }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setActiveTab(t.id as any);
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs transition-all tracking-wide whitespace-nowrap cursor-pointer ${
              activeTab === t.id
                ? "border-indigo-650 text-indigo-700 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* TAB: APPLICATIONS */}
      {activeTab === "applications" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">Marketplace Applications</h3>
            <button
              onClick={() => { setEditingAppId(null); setIsAddingApplication(!isAddingApplication); }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              {isAddingApplication ? "Cancel Form" : <><Plus className="w-4 h-4" /> Add Application</>}
            </button>
          </div>

          {(isAddingApplication || editingAppId) && (
            <form 
              onSubmit={editingAppId ? handleEditApplicationSubmit : handleApplicationSubmit} 
              className="bg-white dark:bg-slate-900 border p-6 rounded-3xl space-y-4 shadow-sm animate-in fade-in"
            >
              <h4 className="font-extrabold text-xs text-indigo-600 flex items-center gap-1.5">
                <AppWindow className="w-4 h-4" /> {editingAppId ? "Edit Application" : "Create Application"}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name</label>
                  <input
                    required type="text" placeholder="Vegetable App"
                    value={editingAppId ? editAppForm.name : appForm.name}
                    onChange={(e) => {
                      if (editingAppId) setEditAppForm({ ...editAppForm, name: e.target.value });
                      else setAppForm({ ...appForm, name: e.target.value });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3.5 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logo URL</label>
                  <input
                    required type="text" placeholder="/images/apps/veg.png"
                    value={editingAppId ? editAppForm.logo : appForm.logo}
                    onChange={(e) => {
                      if (editingAppId) setEditAppForm({ ...editAppForm, logo: e.target.value });
                      else setAppForm({ ...appForm, logo: e.target.value });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3.5 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <input
                  type="text" placeholder="Brief description of application..."
                  value={editingAppId ? editAppForm.description : appForm.description}
                  onChange={(e) => {
                    if (editingAppId) setEditAppForm({ ...editAppForm, description: e.target.value });
                    else setAppForm({ ...appForm, description: e.target.value });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3.5 text-xs font-semibold focus:outline-none"
                />
              </div>
              <button type="submit" className="w-full bg-indigo-650 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs cursor-pointer">
                {editingAppId ? "Save App" : "Create App"}
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {applications.map((app) => (
              <div key={app.id} className="bg-white dark:bg-slate-900 border p-6 rounded-3xl flex flex-col justify-between group relative">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">🏪</span>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingAppId(app.id); setEditAppForm({ name: app.name, logo: app.logo, description: app.description || "", settings: app.settings || "" }); }} className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-indigo-600"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteApplication(app.id)} className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">{app.name}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">{app.description || "No description provided."}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: SHOPS */}
      {activeTab === "shops" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">Registered Shop Outlets</h3>
            <button
              onClick={() => { setEditingShopId(null); setIsAddingShop(!isAddingShop); }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              {isAddingShop ? "Cancel Form" : <><Plus className="w-4 h-4" /> Add Shop Outlet</>}
            </button>
          </div>

          {(isAddingShop || editingShopId) && (
            <form 
              onSubmit={editingShopId ? handleEditShopSubmit : handleShopSubmit} 
              className="bg-white dark:bg-slate-900 border p-6 rounded-3xl space-y-4 shadow-sm animate-in fade-in"
            >
              <h4 className="font-extrabold text-xs text-indigo-600 flex items-center gap-1.5">
                <Building2 className="w-4 h-4" /> {editingShopId ? "Edit Shop Outlet" : "Create Shop Outlet"}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shop Name</label>
                  <input
                    required type="text" placeholder="Mumbai Organic Farm Shop"
                    value={editingShopId ? editShopForm.name : shopForm.name}
                    onChange={(e) => {
                      if (editingShopId) setEditShopForm({ ...editShopForm, name: e.target.value });
                      else setShopForm({ ...shopForm, name: e.target.value });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3.5 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parent Application</label>
                  <select
                    value={editingShopId ? editShopForm.applicationId : shopForm.applicationId}
                    onChange={(e) => {
                      if (editingShopId) setEditShopForm({ ...editShopForm, applicationId: e.target.value });
                      else setShopForm({ ...shopForm, applicationId: e.target.value });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3.5 text-xs font-semibold focus:outline-none text-slate-800 dark:text-slate-200"
                  >
                    <option value="">-- Assign Application --</option>
                    {applications.map(app => (
                      <option key={app.id} value={app.id}>{app.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <input
                  type="text" placeholder="e.g. Selling fresh organic vegetables and greens"
                  value={editingShopId ? editShopForm.description : shopForm.description}
                  onChange={(e) => {
                    if (editingShopId) setEditShopForm({ ...editShopForm, description: e.target.value });
                    else setShopForm({ ...shopForm, description: e.target.value });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-955 border rounded-xl py-2.5 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
                />
              </div>
              <button type="submit" className="w-full bg-indigo-650 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs cursor-pointer">
                {editingShopId ? "Save Shop" : "Create Shop"}
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {shops.map((s) => {
              const app = applications.find(a => a.id === s.applicationId);
              return (
                <div key={s.id} className="bg-white dark:bg-slate-900 border p-6 rounded-3xl flex flex-col justify-between group relative hover:border-indigo-500 transition-all">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[8px] font-black bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400">{app?.name || "Global Shop"}</span>
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingShopId(s.id); setEditShopForm({ name: s.name, logo: s.logo, description: s.description || "", applicationId: s.applicationId || "", status: s.status }); }} className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-indigo-650"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteShop(s.id)} className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-rose-650"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">{s.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-1">{s.description || "No description provided."}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {shops.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 font-sans border border-dashed rounded-3xl">
                No active shop outlets registered. Click "Add Shop" above to begin.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: CATEGORIES */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">Product Categories</h3>
            <button
              onClick={() => { setEditingCatId(null); setIsAddingCategory(!isAddingCategory); }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              {isAddingCategory ? "Cancel Form" : <><Plus className="w-4 h-4" /> Add Category</>}
            </button>
          </div>

          {(isAddingCategory || editingCatId) && (
            <form 
              onSubmit={editingCatId ? handleEditCategorySubmit : handleCategorySubmit} 
              className="bg-white dark:bg-slate-900 border p-6 rounded-3xl space-y-4 shadow-sm animate-in fade-in"
            >
              <h4 className="font-extrabold text-xs text-indigo-600 flex items-center gap-1.5">
                <Tag className="w-4 h-4" /> {editingCatId ? "Edit Category" : "Create Product Category"}
              </h4>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category Name</label>
                <input
                  required type="text" placeholder="e.g. Leafy Vegetables, Organic Dairy"
                  value={editingCatId ? editCatForm.name : categoryForm.name}
                  onChange={(e) => {
                    if (editingCatId) setEditCatForm({ ...editCatForm, name: e.target.value });
                    else setCategoryForm({ ...categoryForm, name: e.target.value });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3.5 text-xs font-semibold focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <input
                  type="text" placeholder="Category description..."
                  value={editingCatId ? editCatForm.description : categoryForm.description}
                  onChange={(e) => {
                    if (editingCatId) setEditCatForm({ ...editCatForm, description: e.target.value });
                    else setCategoryForm({ ...categoryForm, description: e.target.value });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3.5 text-xs font-semibold focus:outline-none"
                />
              </div>
              <button type="submit" className="w-full bg-indigo-650 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs cursor-pointer">
                {editingCatId ? "Save Category" : "Create Category"}
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {categories.map((c) => (
              <div key={c.id} className="bg-white dark:bg-slate-900 border p-4 rounded-2xl flex items-center justify-between group">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">{c.name}</h4>
                  <p className="text-[10px] text-slate-450 mt-0.5">{c.description || "Fresh products"}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingCatId(c.id); setEditCatForm({ name: c.name, description: c.description || "" }); }} className="p-1 text-slate-400 hover:text-indigo-600"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDeleteCategory(c.id)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: PRODUCTS CATALOG */}
      {activeTab === "products" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">Store Products Catalog</h3>
            <button
              onClick={() => { setEditingProdId(null); setIsAddingCatalogProduct(!isAddingCatalogProduct); }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              {isAddingCatalogProduct ? "Cancel Form" : <><Plus className="w-4 h-4" /> Add Product Item</>}
            </button>
          </div>

          {(isAddingCatalogProduct || editingProdId) && (
            <form 
              onSubmit={editingProdId ? handleEditCatalogProductSubmit : handleCatalogProductSubmit} 
              className="bg-white dark:bg-slate-900 border p-6 rounded-3xl space-y-4 shadow-sm animate-in fade-in"
            >
              <h4 className="font-extrabold text-xs text-indigo-600 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4" /> {editingProdId ? "Edit Product Item" : "Create Product Item"}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Name</label>
                  <input
                    required type="text" placeholder="Fresh Organic Apples"
                    value={editingProdId ? editProdForm.name : catalogProductForm.name}
                    onChange={(e) => {
                      if (editingProdId) setEditProdForm({ ...editProdForm, name: e.target.value });
                      else setCatalogProductForm({ ...catalogProductForm, name: e.target.value });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3.5 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unit / Measure</label>
                  <input
                    required type="text" placeholder="e.g. 500 g, 1 kg, 1 pack"
                    value={editingProdId ? editProdForm.unit : catalogProductForm.unit}
                    onChange={(e) => {
                      if (editingProdId) setEditProdForm({ ...editProdForm, unit: e.target.value });
                      else setCatalogProductForm({ ...catalogProductForm, unit: e.target.value });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3.5 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price (₹)</label>
                  <input
                    required type="number" placeholder="₹180"
                    value={editingProdId ? editProdForm.price : catalogProductForm.price}
                    onChange={(e) => {
                      if (editingProdId) setEditProdForm({ ...editProdForm, price: Number(e.target.value) });
                      else setCatalogProductForm({ ...catalogProductForm, price: Number(e.target.value) });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3.5 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Main Image URL</label>
                  <input
                    required type="text" placeholder="https://unsplash.com/...jpg"
                    value={editingProdId ? editProdForm.image : catalogProductForm.image}
                    onChange={(e) => {
                      if (editingProdId) setEditProdForm({ ...editProdForm, image: e.target.value });
                      else setCatalogProductForm({ ...catalogProductForm, image: e.target.value });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-955 border rounded-xl py-2 px-3.5 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Shop Outlet</label>
                  <select
                    value={editingProdId ? (editProdForm.shopId || "") : catalogProductForm.shopId}
                    onChange={(e) => {
                      if (editingProdId) setEditProdForm({ ...editProdForm, shopId: e.target.value });
                      else setCatalogProductForm({ ...catalogProductForm, shopId: e.target.value });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3.5 text-xs font-semibold focus:outline-none text-slate-800 dark:text-slate-200"
                  >
                    <option value="">-- Select Shop Outlet --</option>
                    {shops.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Category</label>
                  <select
                    value={editingProdId ? editProdForm.category : catalogProductForm.category}
                    onChange={(e) => {
                      if (editingProdId) setEditProdForm({ ...editProdForm, category: e.target.value });
                      else setCatalogProductForm({ ...catalogProductForm, category: e.target.value });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-955 border rounded-xl py-2 px-3.5 text-xs font-semibold focus:outline-none text-slate-800 dark:text-slate-200"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quality Tier Tag</label>
                  <input
                    type="text" placeholder="e.g. Premium Grade, Standard"
                    value={editingProdId ? editProdForm.quality : catalogProductForm.quality}
                    onChange={(e) => {
                      if (editingProdId) setEditProdForm({ ...editProdForm, quality: e.target.value });
                      else setCatalogProductForm({ ...catalogProductForm, quality: e.target.value });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3.5 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Discount Rate (%)</label>
                  <input
                    type="number" placeholder="10"
                    value={editingProdId ? editProdForm.discount : catalogProductForm.discount}
                    onChange={(e) => {
                      if (editingProdId) setEditProdForm({ ...editProdForm, discount: Number(e.target.value) });
                      else setCatalogProductForm({ ...catalogProductForm, discount: Number(e.target.value) });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3.5 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock Level Count</label>
                  <input
                    type="number" placeholder="100"
                    value={editingProdId ? editProdForm.stock : catalogProductForm.stock}
                    onChange={(e) => {
                      if (editingProdId) setEditProdForm({ ...editProdForm, stock: Number(e.target.value) });
                      else setCatalogProductForm({ ...catalogProductForm, stock: Number(e.target.value) });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3.5 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Multi-Image Gallery (Comma-separated URLs)</label>
                <input
                  type="text" placeholder="https://image1.jpg, https://image2.jpg"
                  value={editingProdId ? editProdForm.images : catalogProductForm.images}
                  onChange={(e) => {
                    if (editingProdId) setEditProdForm({ ...editProdForm, images: e.target.value });
                    else setCatalogProductForm({ ...catalogProductForm, images: e.target.value });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3.5 text-xs font-semibold focus:outline-none"
                />
              </div>

              <button type="submit" className="w-full bg-indigo-650 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs cursor-pointer">
                {editingProdId ? "Save Catalog Item" : "Create Catalog Item"}
              </button>
            </form>
          )}

          {/* Catalog products list table */}
          <div className="bg-white dark:bg-slate-900 border rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b p-4 bg-slate-50 dark:bg-slate-900/50">
                    <th className="p-4 px-6">Product Details</th>
                    <th className="p-4 px-6">Category</th>
                    <th className="p-4 px-6">Associated Shop Outlet</th>
                    <th className="p-4 px-6">Stock Level</th>
                    <th className="p-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y">
                  {catalogProducts.map((p) => {
                    const shop = shops.find(s => s.id === p.shopId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10">
                        <td className="p-4 px-6 font-bold text-slate-800 dark:text-slate-200">
                          <div className="flex items-center gap-3">
                            <span className="w-9 h-9 relative rounded-lg overflow-hidden bg-muted"><img src={p.image} alt={p.name} className="object-cover w-full h-full" /></span>
                            <div>
                              <p>{p.name}</p>
                              <p className="text-[9px] text-slate-400 font-semibold mt-0.5">₹{p.price} / {p.unit} • {p.quality}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 px-6 text-slate-500">{p.category}</td>
                        <td className="p-4 px-6 font-semibold text-indigo-650">{shop?.name || "Global Shop"}</td>
                        <td className="p-4 px-6">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black ${p.stock > 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.stock} units</span>
                        </td>
                        <td className="p-4 px-6 text-right">
                          <div className="flex gap-1.5 ml-auto w-fit">
                            <button onClick={() => { setEditingProdId(p.id); setEditProdForm({ name: p.name, price: p.price, unit: p.unit, category: p.category, image: p.image, inStock: p.inStock, discount: p.discount, quality: p.quality, description: p.description || "", stock: p.stock, images: p.images || "", shopId: p.shopId || "", applicationId: p.applicationId || "" }); }} className="p-1.5 text-slate-400 hover:text-indigo-650"><Edit className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeleteCatalogProduct(p.id)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: MERCHANT USERS */}
      {activeTab === "merchants" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">Merchant User Accounts</h3>
            <button
              onClick={() => setIsAddingMerchant(!isAddingMerchant)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              {isAddingMerchant ? "Cancel Form" : <><UserPlus className="w-4 h-4" /> Add Merchant Account</>}
            </button>
          </div>

          {isAddingMerchant && (
            <form onSubmit={handleMerchantSubmit} className="bg-white dark:bg-slate-900 border p-6 rounded-3xl space-y-4 shadow-sm animate-in fade-in">
              <h4 className="font-extrabold text-xs text-indigo-600 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4" /> Create Merchant Account
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Merchant Name</label>
                  <input required type="text" placeholder="John Seller" value={merchantForm.name} onChange={(e) => setMerchantForm({ ...merchantForm, name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3.5 text-xs font-semibold focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Merchant Code ID</label>
                  <input required type="text" placeholder="MRT-05" value={merchantForm.employeeId} onChange={(e) => setMerchantForm({ ...merchantForm, employeeId: e.target.value.toUpperCase() })} className="w-full bg-slate-50 dark:bg-slate-955 border rounded-xl py-2 px-3.5 text-xs font-mono font-semibold focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assign Shop Outlet</label>
                  <select
                    value={merchantForm.shopId}
                    onChange={(e) => {
                      const selectedShop = shops.find(s => s.id === e.target.value);
                      setMerchantForm({ ...merchantForm, shopId: e.target.value, applicationId: selectedShop?.applicationId || "" });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3.5 text-xs font-semibold focus:outline-none text-slate-800 dark:text-slate-200"
                  >
                    <option value="">-- Assign Shop Outlet --</option>
                    {shops.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username</label>
                  <input required type="text" placeholder="merchant_shop_owner" value={merchantForm.username} onChange={(e) => setMerchantForm({ ...merchantForm, username: e.target.value.toLowerCase() })} className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3.5 text-xs font-semibold focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</label>
                  <input required type="email" placeholder="merchant@local.com" value={merchantForm.email} onChange={(e) => setMerchantForm({ ...merchantForm, email: e.target.value.toLowerCase() })} className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3.5 text-xs font-semibold focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                  <input required type="password" placeholder="••••••••" value={merchantForm.password} onChange={(e) => setMerchantForm({ ...merchantForm, password: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-955 border rounded-xl py-2 px-3.5 text-xs font-semibold focus:outline-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Access Rights Tab Permissions</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Shop Dashboard", value: "user-dashboard", desc: "Overview stats & charts" },
                    { label: "Inventory Manager", value: "inventory", desc: "Manage catalog prices & stock" },
                    { label: "Order Fulfilment", value: "orders", desc: "Assign & process client orders" }
                  ].map(opt => {
                    const isChecked = selectedMerchantRights.includes(opt.value);
                    return (
                      <label key={opt.value} className={`flex items-start gap-2.5 p-3 border rounded-xl cursor-pointer ${isChecked ? 'border-indigo-500 bg-indigo-50/10 ring-1 ring-indigo-500' : 'border-slate-200'}`}>
                        <input type="checkbox" checked={isChecked} onChange={(e) => e.target.checked ? setSelectedMerchantRights(prev => [...prev, opt.value]) : setSelectedMerchantRights(prev => prev.filter(v => v !== opt.value))} className="mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-slate-850 dark:text-slate-200">{opt.label}</p>
                          <p className="text-[9px] text-slate-450 leading-tight">{opt.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button type="submit" className="w-full bg-indigo-650 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs cursor-pointer">Save Merchant</button>
            </form>
          )}

          <div className="bg-white dark:bg-slate-900 border rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b p-4 bg-slate-50 dark:bg-slate-900/50">
                    <th className="p-4 px-6">ID & Shop Merchant Name</th>
                    <th className="p-4 px-6">Username</th>
                    <th className="p-4 px-6">Email</th>
                    <th className="p-4 px-6">Associated Shop Outlet</th>
                    <th className="p-4 px-6 text-right">Status Toggle</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y">
                  {merchants.map((m) => {
                    const shop = shops.find(s => s.id === m.shopId);
                    return (
                      <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10">
                        <td className="p-4 px-6 font-bold text-slate-800 dark:text-slate-200">
                          <div>{m.name}</div>
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">{m.employeeId || "MRT-N/A"}</div>
                        </td>
                        <td className="p-4 px-6 font-semibold text-slate-655">{m.username}</td>
                        <td className="p-4 px-6 text-slate-500 font-medium">{m.email}</td>
                        <td className="p-4 px-6 font-bold text-indigo-650">{shop ? shop.name : "None / Global"}</td>
                        <td className="p-4 px-6 text-right">
                          <button onClick={() => toggleUserStatus(m)} className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase transition-colors cursor-pointer ${m.status === 'ACTIVE' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                            {m.status}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ORDERS */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">Store Orders Fulfillments</h3>
          
          <div className="bg-white dark:bg-slate-900 border rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b p-4 bg-slate-50 dark:bg-slate-900/50">
                    <th className="p-4 px-6">Order ID & Date</th>
                    <th className="p-4 px-6">Customer Details</th>
                    <th className="p-4 px-6">Total Amount</th>
                    <th className="p-4 px-6">Delivery details</th>
                    <th className="p-4 px-6 text-right">Status Fulfillment</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10">
                      <td className="p-4 px-6 font-bold text-slate-800 dark:text-slate-200">
                        <div>Order #{o.id.slice(-6).toUpperCase()}</div>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">{new Date(o.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4 px-6 text-slate-655">
                        <p className="font-semibold">{o.user?.name || "Guest Buyer"}</p>
                        <p className="text-[10px] text-slate-400">{o.user?.email || "guest@local.com"}</p>
                      </td>
                      <td className="p-4 px-6 font-black text-indigo-650">₹{o.totalAmount}</td>
                      <td className="p-4 px-6 text-slate-500 font-medium max-w-xs truncate">
                        <p>{o.deliveryAddress}</p>
                        <p className="text-[10px] text-primary">{o.deliveryPhone}</p>
                      </td>
                      <td className="p-4 px-6 text-right">
                        <select
                          value={o.status}
                          onChange={(e) => handleOrderUpdate(o.id, e.target.value)}
                          className="bg-slate-50 border rounded-xl py-1 px-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="PACKED">PACKED</option>
                          <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                          <option value="DELIVERED">DELIVERED</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">No storefront orders found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: REPORTS */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">Analytics & Sales Reports</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 border p-6 rounded-3xl shadow-sm text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Revenue</p>
              <h4 className="text-3xl font-black text-indigo-650 mt-2">₹{orders.reduce((acc, o) => acc + o.totalAmount, 0)}</h4>
              <p className="text-[10px] text-emerald-600 font-bold mt-1">↑ 14.5% vs last month</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border p-6 rounded-3xl shadow-sm text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Orders</p>
              <h4 className="text-3xl font-black text-emerald-650 mt-2">{orders.filter(o => o.status !== 'DELIVERED').length}</h4>
              <p className="text-[10px] text-slate-500 mt-1">Processing in operations</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border p-6 rounded-3xl shadow-sm text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Shop Outlets</p>
              <h4 className="text-3xl font-black text-blue-650 mt-2">{shops.length}</h4>
              <p className="text-[10px] text-slate-500 mt-1">SaaS marketplace tenants</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border p-6 rounded-3xl shadow-sm">
            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">SaaS Applications Market Share</h4>
            <div className="h-64 flex items-end justify-between gap-4 pt-10 px-4">
              {applications.map(app => {
                const appOrders = orders.filter(o => o.applicationId === app.id);
                const sales = appOrders.reduce((sum, o) => sum + o.totalAmount, 0);
                const maxSales = Math.max(...applications.map(a => orders.filter(o => o.applicationId === a.id).reduce((sum, o) => sum + o.totalAmount, 0)), 100);
                const heightPercent = Math.max((sales / maxSales) * 100, 10);
                return (
                  <div key={app.id} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div className="text-[10px] font-bold text-indigo-650">₹{sales}</div>
                    <div 
                      style={{ height: `${heightPercent}%` }} 
                      className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 dark:from-indigo-700 dark:to-indigo-500 rounded-t-lg transition-all duration-700 hover:opacity-85 shadow-md"
                    />
                    <div className="text-[10px] font-bold text-slate-655 truncate w-full text-center">{app.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB: SETTINGS */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">Global SaaS Applications Configurations</h3>
          
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 space-y-6 shadow-sm">
            <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex items-center justify-between py-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-850 dark:text-slate-250">Enable Customer Self-Registration</h4>
                  <p className="text-[10px] text-slate-500">Allow guests to register directly on the storefront login page.</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded text-indigo-650" />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-850 dark:text-slate-250">Enforce Concurrent Session Restrictions</h4>
                  <p className="text-[10px] text-slate-500">Log users out of other devices immediately on duplicate session check.</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded text-indigo-650" />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-850 dark:text-slate-250">Allow Guest Product Browsing</h4>
                  <p className="text-[10px] text-slate-500">Permit visitors to view categories and products without logging in.</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded text-indigo-650" />
              </div>
            </div>

            <button onClick={() => setSuccessMsg("Global SaaS settings saved successfully!")} className="w-full bg-slate-900 hover:bg-slate-850 dark:bg-indigo-650 text-white py-3 rounded-2xl font-bold text-xs shadow-md transition-all cursor-pointer">
              Save Global Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
