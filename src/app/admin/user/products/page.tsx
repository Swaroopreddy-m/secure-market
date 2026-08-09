"use client";

import { useState, useEffect } from "react";
import { 
  ShoppingBag, Plus, Search, Trash2, Edit3, Send, Save, Loader2, AlertCircle, 
  CheckCircle2, X, History, RotateCcw, AlertTriangle, Eye
} from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  categoryId: string;
  category: Category;
  name: string;
  code: string;
  brand: string;
  sku: string;
  barcode: string;
  shortDescription: string;
  longDescription: string;
  unit: string;
  weight: number;
  dimensions: string;
  tax: number;
  hsnCode: string;
  status: string;
  approvalStatus: string;
  remarks: string;
  version: number;
}

interface HistoryRecord {
  id: string;
  version: number;
  name: string;
  brand: string;
  shortDescription: string;
  status: string;
  action: string;
  changedBy: string;
  timestamp: string;
}

export default function MerchantProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    categoryId: "",
    name: "",
    brand: "",
    sku: "",
    barcode: "",
    shortDescription: "",
    longDescription: "",
    unit: "pcs",
    weight: "",
    dimensions: "",
    tax: "0.0",
    hsnCode: "",
    status: "ACTIVE",
    remarks: ""
  });

  // History State
  const [viewingHistoryProduct, setViewingHistoryProduct] = useState<Product | null>(null);
  const [historyLogs, setHistoryLogs] = useState<HistoryRecord[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/merchant/products"),
        fetch("/api/merchant/categories")
      ]);

      if (!prodRes.ok || !catRes.ok) throw new Error("Failed to load products/categories data.");
      
      const prodData = await prodRes.json();
      const catData = await catRes.json();

      setProducts(prodData);
      setCategories(catData.filter((c: any) => c.approvalStatus === "APPROVED")); // only approved categories
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenCreate = () => {
    if (categories.length === 0) {
      alert("You must have at least one approved category before creating products.");
      return;
    }
    setEditId(null);
    setFormData({
      categoryId: categories[0]?.id || "",
      name: "",
      brand: "",
      sku: "",
      barcode: "",
      shortDescription: "",
      longDescription: "",
      unit: "pcs",
      weight: "",
      dimensions: "",
      tax: "0.0",
      hsnCode: "",
      status: "ACTIVE",
      remarks: ""
    });
    setError(null);
    setSuccess(null);
    setShowForm(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditId(p.id);
    setFormData({
      categoryId: p.categoryId,
      name: p.name,
      brand: p.brand || "",
      sku: p.sku || "",
      barcode: p.barcode || "",
      shortDescription: p.shortDescription || "",
      longDescription: p.longDescription || "",
      unit: p.unit || "pcs",
      weight: p.weight ? String(p.weight) : "",
      dimensions: p.dimensions || "",
      tax: String(p.tax),
      hsnCode: p.hsnCode || "",
      status: p.status,
      remarks: p.remarks || ""
    });
    setError(null);
    setSuccess(null);
    setShowForm(true);
  };

  const handleSaveOrSubmit = async (submitStatus: "DRAFT" | "PENDING") => {
    if (!formData.categoryId || !formData.name) {
      setError("Category selection and Product Name are required.");
      return;
    }

    setIsSubmitLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const url = editId 
        ? `/api/merchant/products/${editId}` 
        : "/api/merchant/products";
      
      const method = editId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, submitStatus })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save product.");

      setSuccess(`Product details successfully ${editId ? "updated" : "created"} under status ${submitStatus === "PENDING" ? "Pending review" : "Draft"}.`);
      setShowForm(false);
      fetchInitialData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const conf = window.confirm(`Are you sure you want to delete product ${name}? If Delete approval rules are enabled, this will submit a request to the Product Admin reviewer.`);
    if (!conf) return;

    setIsSubmitLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/merchant/products/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process product deletion.");

      setSuccess(data.message || "Product deleted successfully.");
      fetchInitialData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleFetchHistory = async (p: Product) => {
    setViewingHistoryProduct(p);
    setIsHistoryLoading(true);
    setHistoryLogs([]);
    try {
      const res = await fetch(`/api/merchant/products/${p.id}/versions`);
      if (res.ok) {
        const data = await res.json();
        setHistoryLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleRestoreVersion = async (ver: number) => {
    if (!viewingHistoryProduct) return;
    const conf = window.confirm(`Restore product properties back to version ${ver}?`);
    if (!conf) return;

    setIsSubmitLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/merchant/products/${viewingHistoryProduct.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: ver })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to restore version.");

      setSuccess(`Product details rolled back successfully to version ${ver}.`);
      setViewingHistoryProduct(null);
      fetchInitialData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand && p.brand.toLowerCase().includes(search.toLowerCase())) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const getBadgeClass = (appStatus: string, finalStatus: string) => {
    if (finalStatus === "PENDING_DELETE") {
      return "bg-rose-50 text-rose-700 dark:bg-rose-955/20 border border-rose-200/50";
    }
    switch (appStatus) {
      case "APPROVED":
        return "bg-green-50 text-green-700 dark:bg-green-950/20 border border-green-200/50";
      case "PENDING":
        return "bg-amber-50 text-amber-700 dark:bg-amber-955/20 border border-amber-200/50";
      case "REJECTED":
        return "bg-rose-50 text-rose-700 dark:bg-rose-955/20 border border-rose-200/50";
      case "RETURNED":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 border border-slate-200/50";
      default:
        return "bg-slate-50 text-slate-505 border border-slate-200/50";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 p-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Products Catalog</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Manage your product registrations, specifications, and view modification logs.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-1.5 px-5 py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-indigo-655/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Product
          </button>
        )}
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-455 p-4 rounded-2xl text-xs font-bold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {showForm ? (
        /* Create Product Form */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-slate-850">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
              {editId ? "Modify Product Specifications" : "Register Product"}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Product Name</label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Red Tomatoes"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Assigned Category</label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Brand Name</label>
              <input
                type="text"
                name="brand"
                placeholder="e.g. Organic Farm"
                value={formData.brand}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">SKU Code</label>
              <input
                type="text"
                name="sku"
                placeholder="e.g. SKU-12345"
                value={formData.sku}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Barcode</label>
              <input
                type="text"
                name="barcode"
                placeholder="e.g. 8901234567"
                value={formData.barcode}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Unit Measurement</label>
              <input
                type="text"
                name="unit"
                placeholder="e.g. Kg, Pcs, Box"
                value={formData.unit}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Weight (kg)</label>
              <input
                type="number"
                step="0.01"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Dimensions (L x W x H)</label>
              <input
                type="text"
                name="dimensions"
                placeholder="e.g. 10x10x5 cm"
                value={formData.dimensions}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tax (GST %)</label>
              <input
                type="number"
                step="0.1"
                name="tax"
                value={formData.tax}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">HSN Code</label>
              <input
                type="text"
                name="hsnCode"
                placeholder="e.g. HSN-123"
                value={formData.hsnCode}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="col-span-1 md:col-span-3 space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Short Summary / Highlights</label>
              <input
                type="text"
                name="shortDescription"
                placeholder="Product quick bullet summary..."
                value={formData.shortDescription}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="col-span-1 md:col-span-3 space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Long Description</label>
              <textarea
                name="longDescription"
                rows={3}
                placeholder="Full details on product specifications and features..."
                value={formData.longDescription}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="col-span-1 md:col-span-3 space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Maker Remarks / Notes</label>
              <textarea
                name="remarks"
                rows={2}
                placeholder="Describe justifications or reasons for modifications..."
                value={formData.remarks}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
            <button
              onClick={() => handleSaveOrSubmit("DRAFT")}
              disabled={isSubmitLoading}
              className="flex items-center justify-center gap-1.5 px-5 py-3 border border-indigo-650 text-indigo-650 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-2xl font-bold text-xs active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" /> Save Draft
            </button>
            <button
              onClick={() => handleSaveOrSubmit("PENDING")}
              disabled={isSubmitLoading}
              className="flex items-center justify-center gap-1.5 px-5 py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs active:scale-95 transition-all shadow-md shadow-indigo-655/25"
            >
              <Send className="w-4 h-4" /> Submit for Approval
            </button>
          </div>

        </div>
      ) : (
        /* Products Catalog Grid */
        <>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by code, name, brand, SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 focus:outline-none text-xs font-bold text-slate-750 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto font-sans">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/40 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850">
                    <th className="p-4">Product Code</th>
                    <th className="p-4">Product Details</th>
                    <th className="p-4">Category</th>
                    <th className="p-4 text-center">Version</th>
                    <th className="p-4">Approval status</th>
                    <th className="p-4">Active status</th>
                    <th className="p-4 text-center">History</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-semibold text-slate-655 dark:text-slate-350">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-650" />
                        Fetching products catalog...
                      </td>
                    </tr>
                  ) : filteredProducts.length > 0 ? (
                    filteredProducts.map((p) => {
                      const isEditable = p.approvalStatus !== "PENDING";
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-850 dark:text-slate-200">{p.code}</td>
                          <td className="p-4">
                            <div className="font-bold text-slate-850 dark:text-slate-100">{p.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">Brand: {p.brand || "-"} | SKU: {p.sku || "-"}</div>
                          </td>
                          <td className="p-4">{p.category?.name || "Unassigned"}</td>
                          <td className="p-4 text-center font-bold font-mono">v{p.version}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getBadgeClass(p.approvalStatus, p.status)}`}>
                              {p.approvalStatus}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              p.status === "ACTIVE" ? "bg-green-50 text-green-700 dark:bg-green-950/20" : "bg-slate-100 text-slate-500"
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleFetchHistory(p)}
                              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl"
                              title="Product Version History logs"
                            >
                              <History className="w-4 h-4" />
                            </button>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {isEditable ? (
                                <>
                                  <button
                                    onClick={() => handleOpenEdit(p)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-650 rounded-xl transition-all"
                                    title="Edit Product"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(p.id, p.name)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-650 rounded-xl transition-all"
                                    title="Delete Product"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Locked (Reviewing)</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                        No products found in catalog. Click "Create Product" to add.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Product Version logs Popup Modal */}
      {viewingHistoryProduct && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[500px] flex flex-col">
            
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-500" /> Version History: {viewingHistoryProduct.name}
              </h3>
              <button 
                onClick={() => setViewingHistoryProduct(null)}
                className="text-slate-400 hover:text-slate-655 text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 hide-scrollbar">
              {isHistoryLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-650" />
                </div>
              ) : historyLogs.length > 0 ? (
                historyLogs.map((log) => (
                  <div key={log.id} className="p-4 bg-slate-50 dark:bg-slate-955/50 border rounded-2xl flex justify-between items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 font-black font-mono text-[10px] rounded-md">
                          v{log.version}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest">
                          {log.action}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-250">{log.name}</p>
                      <p className="text-[10px] text-slate-500 max-w-xs">{log.shortDescription || "No notes details."}</p>
                      <div className="text-[9px] text-slate-400 font-semibold flex items-center gap-2">
                        <span>By: {log.changedBy}</span>
                        <span>•</span>
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    {/* Disable restore on the CURRENT active version */}
                    {log.version !== viewingHistoryProduct.version ? (
                      <button
                        onClick={() => handleRestoreVersion(log.version)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded-xl font-bold text-[10px] uppercase tracking-wider"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Restore
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-650 font-black uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Current
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6 font-semibold">No version snapshots logged.</p>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
