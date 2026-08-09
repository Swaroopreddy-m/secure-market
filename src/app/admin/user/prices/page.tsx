"use client";

import { useState, useEffect } from "react";
import { 
  Tag, Plus, Search, Send, Save, Loader2, AlertCircle, CheckCircle2, X
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  code: string;
}

interface PriceRecord {
  id: string;
  productId: string;
  product: Product;
  mrp: number;
  sellingPrice: number;
  offerPrice: number;
  discount: number;
  gst: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo: string;
  status: string;
  approvalStatus: string;
  remarks: string;
}

export default function MerchantPricesPage() {
  const [prices, setPrices] = useState<PriceRecord[]>([]);
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
    mrp: "0.00",
    sellingPrice: "0.00",
    offerPrice: "0.00",
    gst: "0.0",
    currency: "USD",
    effectiveFrom: "",
    effectiveTo: "",
    status: "ACTIVE",
    remarks: ""
  });

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [pricesRes, prodRes] = await Promise.all([
        fetch("/api/merchant/prices"),
        fetch("/api/merchant/products")
      ]);

      if (!pricesRes.ok || !prodRes.ok) throw new Error("Failed to load product pricing.");

      const pricesData = await pricesRes.json();
      const prodData = await prodRes.json();

      setPrices(pricesData);
      setProducts(prodData.filter((p: any) => p.approvalStatus === "APPROVED")); // only approved products
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
    if (products.length === 0) {
      alert("You must have at least one approved product before setting pricing details.");
      return;
    }
    setFormData({
      productId: products[0]?.id || "",
      mrp: "0.00",
      sellingPrice: "0.00",
      offerPrice: "0.00",
      gst: "0.0",
      currency: "USD",
      effectiveFrom: "",
      effectiveTo: "",
      status: "ACTIVE",
      remarks: ""
    });
    setError(null);
    setSuccess(null);
    setShowForm(true);
  };

  const handleSaveOrSubmit = async (submitStatus: "DRAFT" | "PENDING") => {
    const mrpNum = parseFloat(formData.mrp);
    const sellNum = parseFloat(formData.sellingPrice);

    if (!formData.productId || mrpNum <= 0 || sellNum <= 0) {
      setError("Please select a Product and provide valid MRP and Selling Prices.");
      return;
    }

    if (sellNum > mrpNum) {
      setError("Selling price cannot exceed MRP.");
      return;
    }

    setIsSubmitLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/merchant/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, submitStatus })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update price details.");

      setSuccess(`Product pricing details successfully updated with status ${submitStatus === "PENDING" ? "Pending Approval" : "Draft"}.`);
      setShowForm(false);
      fetchInitialData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const filteredPrices = prices.filter(p =>
    p.product.name.toLowerCase().includes(search.toLowerCase()) ||
    p.currency.toLowerCase().includes(search.toLowerCase())
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
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Price Management</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Configure MRP, Selling Prices, discounts, tax parameters, and effective pricing date ranges.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-1.5 px-5 py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-indigo-655/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Configure Pricing
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
        <div className="bg-rose-50 border border-rose-100 text-rose-705 dark:bg-rose-955/20 dark:border-rose-900/30 dark:text-rose-455 p-4 rounded-2xl text-xs font-bold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {showForm ? (
        /* Create Form */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-slate-850">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
              Configure Pricing Record
            </h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-655">
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
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">MRP ($)</label>
              <input
                type="number"
                step="0.01"
                name="mrp"
                value={formData.mrp}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Selling Price ($)</label>
              <input
                type="number"
                step="0.01"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Offer Price ($)</label>
              <input
                type="number"
                step="0.01"
                name="offerPrice"
                value={formData.offerPrice}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tax (GST %)</label>
              <input
                type="number"
                step="0.1"
                name="gst"
                value={formData.gst}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Currency</label>
              <input
                type="text"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Effective From</label>
              <input
                type="date"
                name="effectiveFrom"
                value={formData.effectiveFrom}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Effective To</label>
              <input
                type="date"
                name="effectiveTo"
                value={formData.effectiveTo}
                onChange={handleChange}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Remarks / Notes</label>
              <input
                type="text"
                name="remarks"
                placeholder="Pricing remarks..."
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
              <Send className="w-4 h-4" /> Submit Pricing
            </button>
          </div>

        </div>
      ) : (
        /* List grid */
        <>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search prices by product name..."
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
                    <th className="p-4">Product Name</th>
                    <th className="p-4 text-center">MRP</th>
                    <th className="p-4 text-center">Selling Price</th>
                    <th className="p-4 text-center">Offer Price</th>
                    <th className="p-4 text-center">Discount (%)</th>
                    <th className="p-4 text-center">GST (%)</th>
                    <th className="p-4">Approval status</th>
                    <th className="p-4">Active status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-semibold text-slate-655 dark:text-slate-350">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-650" />
                        Fetching pricing configurations...
                      </td>
                    </tr>
                  ) : filteredPrices.length > 0 ? (
                    filteredPrices.map((price) => (
                      <tr key={price.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="p-4 font-bold text-slate-850 dark:text-slate-100">{price.product.name}</td>
                        <td className="p-4 text-center font-bold font-mono text-slate-800 dark:text-slate-200">
                          {price.currency} {price.mrp.toFixed(2)}
                        </td>
                        <td className="p-4 text-center font-bold font-mono text-indigo-650 dark:text-indigo-400">
                          {price.currency} {price.sellingPrice.toFixed(2)}
                        </td>
                        <td className="p-4 text-center font-mono text-slate-600 dark:text-slate-400">
                          {price.currency} {price.offerPrice.toFixed(2)}
                        </td>
                        <td className="p-4 text-center font-bold text-emerald-650 font-mono">
                          {price.discount.toFixed(1)}%
                        </td>
                        <td className="p-4 text-center font-mono">{price.gst}%</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getBadgeClass(price.approvalStatus, price.status)}`}>
                            {price.approvalStatus}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            price.status === "ACTIVE" ? "bg-green-50 text-green-700 dark:bg-green-950/20" : "bg-slate-100 text-slate-500"
                          }`}>
                            {price.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                        No pricing policies configured. Click "Configure Pricing" to start.
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
