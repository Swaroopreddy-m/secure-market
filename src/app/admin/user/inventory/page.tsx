"use client";

import { useState, useEffect } from "react";
import { 
  Sliders, Plus, Search, Send, Save, Loader2, AlertCircle, CheckCircle2, X
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  code: string;
}

interface InventoryBatch {
  id: string;
  productId: string;
  product: Product;
  batchNumber: string;
  quantity: number;
  availableQuantity: number;
  minimumStock: number;
  maximumStock: number;
  purchasePrice: number;
  sellingPrice: number;
  expiryDate: string;
  manufacturingDate: string;
  supplier: string;
  warehouse: string;
  status: string;
  approvalStatus: string;
  remarks: string;
}

export default function MerchantInventoryPage() {
  const [inventories, setInventories] = useState<InventoryBatch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    productId: "",
    batchNumber: "",
    quantity: "0",
    minimumStock: "10",
    maximumStock: "1000",
    purchasePrice: "0.00",
    sellingPrice: "0.00",
    expiryDate: "",
    manufacturingDate: "",
    supplier: "",
    warehouse: "",
    status: "ACTIVE",
    remarks: ""
  });

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [invRes, prodRes] = await Promise.all([
        fetch("/api/merchant/inventories"),
        fetch("/api/merchant/products")
      ]);

      if (!invRes.ok || !prodRes.ok) throw new Error("Failed to load inventory logs.");

      const invData = await invRes.json();
      const prodData = await prodRes.json();

      setInventories(invData);
      setProducts(prodData.filter((p: any) => p.approvalStatus === "APPROVED")); // only approved products
    } catch (err: any) {
      setError(err.message);
    } opacity:
    setIsLoading(false);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenCreate = () => {
    if (products.length === 0) {
      alert("You must have at least one approved product before generating stock batches.");
      return;
    }
    setFormData({
      productId: products[0]?.id || "",
      batchNumber: `BAT-${Date.now().toString().slice(-6)}`,
      quantity: "0",
      minimumStock: "10",
      maximumStock: "1000",
      purchasePrice: "0.00",
      sellingPrice: "0.00",
      expiryDate: "",
      manufacturingDate: "",
      supplier: "",
      warehouse: "",
      status: "ACTIVE",
      remarks: ""
    });
    setError(null);
    setSuccess(null);
    setShowForm(true);
  };

  const handleSaveOrSubmit = async (submitStatus: "DRAFT" | "PENDING") => {
    if (!formData.productId || parseInt(formData.quantity) < 0) {
      setError("Please select a Product and provide a valid quantity.");
      return;
    }

    setIsSubmitLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/merchant/inventories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, submitStatus })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update inventory.");

      setSuccess(`Inventory batch successfully submitted under status ${submitStatus === "PENDING" ? "Pending Approval" : "Draft"}.`);
      setShowForm(false);
      fetchInitialData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const filteredInventories = inventories.filter(inv =>
    inv.product.name.toLowerCase().includes(search.toLowerCase()) ||
    inv.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
    (inv.supplier && inv.supplier.toLowerCase().includes(search.toLowerCase())) ||
    (inv.warehouse && inv.warehouse.toLowerCase().includes(search.toLowerCase()))
  );

  const getBadgeClass = (appStatus: string, finalStatus: string) => {
    switch (appStatus) {
      case "APPROVED":
        return "bg-green-50 text-green-700 dark:bg-green-950/20 border border-green-200/50";
      case "PENDING":
        return "bg-amber-50 text-amber-700 dark:bg-amber-955/20 border border-amber-200/50";
      case "REJECTED":
        return "bg-rose-50 text-rose-700 dark:bg-rose-955/20 border border-rose-200/50";
      case "RETURNED":
        return "bg-slate-105 text-slate-700 dark:bg-slate-800 border border-slate-200/50";
      default:
        return "bg-slate-50 text-slate-505 border border-slate-200/50";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 p-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Stock & Inventory</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Allocate batch numbers, manage warehouse stock levels, and coordinate safety minimum stocks.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-1.5 px-5 py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-indigo-655/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Stock Batch
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
        <div className="bg-rose-50 border border-rose-100 text-rose-700 dark:bg-rose-955/20 dark:border-rose-900/30 dark:text-rose-455 p-4 rounded-2xl text-xs font-bold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {showForm ? (
        /* Create Form */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-slate-850">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
              Allocate Stock Batch
            </h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Select Product</label>
              <select
                name="productId"
                value={formData.productId}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Batch Number</label>
              <input
                type="text"
                name="batchNumber"
                placeholder="e.g. BATCH-001"
                value={formData.batchNumber}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Quantity</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Minimum Alert Stock</label>
              <input
                type="number"
                name="minimumStock"
                value={formData.minimumStock}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Maximum Capacity</label>
              <input
                type="number"
                name="maximumStock"
                value={formData.maximumStock}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Purchase Price ($)</label>
              <input
                type="number"
                step="0.01"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Supplier Name</label>
              <input
                type="text"
                name="supplier"
                placeholder="e.g. Fresh Distributors"
                value={formData.supplier}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Warehouse Name</label>
              <input
                type="text"
                name="warehouse"
                placeholder="e.g. Central Warehouse A"
                value={formData.warehouse}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Manufacturing Date</label>
              <input
                type="date"
                name="manufacturingDate"
                value={formData.manufacturingDate}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Expiry Date</label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Remarks</label>
              <input
                type="text"
                name="remarks"
                placeholder="Batch remarks..."
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
              <Send className="w-4 h-4" /> Submit Batch
            </button>
          </div>

        </div>
      ) : (
        /* List */
        <>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search stock by product, batch, supplier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 focus:outline-none text-xs font-bold text-slate-750 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/40 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850">
                    <th className="p-4">Batch Number</th>
                    <th className="p-4">Product Name</th>
                    <th className="p-4 text-center">Allocated Qty</th>
                    <th className="p-4 text-center">Available Qty</th>
                    <th className="p-4">Warehouse</th>
                    <th className="p-4">Supplier</th>
                    <th className="p-4">Approval status</th>
                    <th className="p-4">Active status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-semibold text-slate-655 dark:text-slate-350">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-650" />
                        Loading stock registries...
                      </td>
                    </tr>
                  ) : filteredInventories.length > 0 ? (
                    filteredInventories.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-850 dark:text-slate-200">{inv.batchNumber}</td>
                        <td className="p-4 font-bold text-slate-850 dark:text-slate-100">{inv.product.name}</td>
                        <td className="p-4 text-center font-bold font-mono text-slate-800 dark:text-slate-200">{inv.quantity}</td>
                        <td className="p-4 text-center font-bold font-mono text-slate-800 dark:text-slate-200">{inv.availableQuantity}</td>
                        <td className="p-4">{inv.warehouse || "-"}</td>
                        <td className="p-4">{inv.supplier || "-"}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getBadgeClass(inv.approvalStatus, inv.status)}`}>
                            {inv.approvalStatus}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            inv.status === "ACTIVE" ? "bg-green-50 text-green-700 dark:bg-green-950/20" : "bg-slate-100 text-slate-500"
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                        No inventory batches registered. Click "Create Stock Batch" to allocate stock.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
