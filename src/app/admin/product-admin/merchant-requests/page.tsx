"use client";

import { useState, useEffect } from "react";
import { 
  CheckSquare, Square, Check, X, CornerUpLeft, Loader2, AlertCircle, CheckCircle2, MessageSquare
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  code: string;
  description: string;
  status: string;
}

interface Product {
  id: string;
  name: string;
  code: string;
  brand: string;
  sku: string;
  status: string;
}

interface Inventory {
  id: string;
  batchNumber: string;
  product: { name: string };
  quantity: number;
}

interface Price {
  id: string;
  product: { name: string };
  mrp: number;
  sellingPrice: number;
  currency: string;
}

interface Image {
  id: string;
  product: { name: string };
  url: string;
  isPrimary: boolean;
}

export default function ProductAdminMerchantRequests() {
  const [data, setData] = useState<{
    categories: Category[];
    products: Product[];
    inventories: Inventory[];
    prices: Price[];
    images: Image[];
  }>({
    categories: [],
    products: [],
    inventories: [],
    prices: [],
    images: []
  });

  const [activeTab, setActiveTab] = useState<"CATEGORY" | "PRODUCT" | "INVENTORY" | "PRICE" | "IMAGE">("CATEGORY");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [remarks, setRemarks] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/product-admin/merchant-requests");
      if (!res.ok) throw new Error("Failed to fetch pending merchant requests.");
      const resData = await res.json();
      setData(resData);
      setSelectedIds([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSelectToggle = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const getActiveTabList = () => {
    switch (activeTab) {
      case "CATEGORY": return data.categories;
      case "PRODUCT": return data.products;
      case "INVENTORY": return data.inventories;
      case "PRICE": return data.prices;
      case "IMAGE": return data.images;
    }
  };

  const activeList = getActiveTabList();

  const handleSelectAllToggle = () => {
    if (selectedIds.length === activeList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(activeList.map(item => item.id));
    }
  };

  const handleProcessAction = async (action: "APPROVE" | "REJECT" | "RETURN") => {
    if (selectedIds.length === 0) {
      setError("Please select at least one record to process.");
      return;
    }

    if ((action === "REJECT" || action === "RETURN") && !remarks.trim()) {
      setError("Checker remarks are mandatory for Reject and Return actions.");
      return;
    }

    setIsSubmitLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/product-admin/merchant-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          type: activeTab,
          action,
          remarks
        })
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to process requests.");

      setSuccess(`Successfully processed ${selectedIds.length} ${activeTab.toLowerCase()} requests.`);
      setRemarks("");
      fetchRequests();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 p-6">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Merchant Submissions Confirmation</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Review and approve categories, products, prices, and stock allocations uploaded by your Merchant staff.
        </p>
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

      {/* Tabs list */}
      <div className="flex overflow-x-auto whitespace-nowrap border-b border-slate-200 dark:border-slate-800 gap-1 sm:gap-2 pb-px scrollbar-none">
        {(["CATEGORY", "PRODUCT", "INVENTORY", "PRICE", "IMAGE"] as const).map(tab => {
          let count = 0;
          switch (tab) {
            case "CATEGORY": count = data.categories.length; break;
            case "PRODUCT": count = data.products.length; break;
            case "INVENTORY": count = data.inventories.length; break;
            case "PRICE": count = data.prices.length; break;
            case "IMAGE": count = data.images.length; break;
          }
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedIds([]);
              }}
              className={`pb-3 px-3 sm:px-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider relative transition-all ${
                isActive ? "text-indigo-650 dark:text-indigo-400" : "text-slate-400 hover:text-slate-655"
              }`}
            >
              {tab.toLowerCase()}s
              {count > 0 && (
                <span className="ml-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-455 rounded-full text-[9px] font-black">
                  {count}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-650 dark:bg-indigo-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Reviewer Action remarks */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-indigo-500 mt-1 flex-shrink-0" />
          <div className="w-full space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Checker Evaluation Remarks</label>
            <textarea
              rows={2}
              placeholder="Provide comments or evaluation notes. Remarks are mandatory if Rejecting or Returning submissions."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-855 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={() => handleProcessAction("RETURN")}
            disabled={isSubmitLoading || selectedIds.length === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4.5 py-2.5 border border-amber-600 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-955/20 rounded-2xl font-bold text-xs active:scale-95 transition-all disabled:opacity-50"
          >
            <CornerUpLeft className="w-4 h-4" /> Return to Maker
          </button>
          <button
            onClick={() => handleProcessAction("REJECT")}
            disabled={isSubmitLoading || selectedIds.length === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4.5 py-2.5 border border-rose-600 text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-2xl font-bold text-xs active:scale-95 transition-all disabled:opacity-50"
          >
            <X className="w-4 h-4" /> Reject Submission
          </button>
          <button
            onClick={() => handleProcessAction("APPROVE")}
            disabled={isSubmitLoading || selectedIds.length === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs active:scale-95 transition-all shadow-md shadow-indigo-655/25 disabled:opacity-50"
          >
            <Check className="w-4 h-4" /> Approve & Publish
          </button>
        </div>
      </div>

      {/* Grid list table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/40 text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850">
                <th className="p-4 w-12 text-center">
                  <button onClick={handleSelectAllToggle} className="text-slate-400 hover:text-slate-600">
                    {selectedIds.length === activeList.length && activeList.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-indigo-650" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-4">Reference Code / ID</th>
                <th className="p-4">Submission Details</th>
                <th className="p-4">Category / Context</th>
                <th className="p-4 text-right">Metrics / Pricing / Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-semibold text-slate-655 dark:text-slate-350">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-650" />
                    Loading pending requests...
                  </td>
                </tr>
              ) : activeList.length > 0 ? (
                activeList.map((item: any) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="p-4 text-center">
                        <button onClick={() => handleSelectToggle(item.id)} className="text-slate-400 hover:text-slate-600">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-650" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-850 dark:text-slate-200">
                        {item.code || item.batchNumber || item.id.slice(-8)}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-850 dark:text-slate-100">{item.name || item.product?.name || "Image Asset"}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Maker: {item.makerUsername || "Merchant"}</div>
                      </td>
                      <td className="p-4">
                        {item.category?.name || item.product?.name || "Merchant Catalog"}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-slate-850 dark:text-slate-100">
                        {activeTab === "PRICE" && `$${item.sellingPrice.toFixed(2)} (MRP: $${item.mrp.toFixed(2)})`}
                        {activeTab === "INVENTORY" && `${item.quantity} units`}
                        {activeTab === "IMAGE" && (item.isPrimary ? "Primary" : "Gallery")}
                        {activeTab === "CATEGORY" && (item.status === "PENDING_DELETE" ? "PENDING DELETE" : "ACTIVE")}
                        {activeTab === "PRODUCT" && item.status}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">
                    No pending {activeTab.toLowerCase()} requests awaiting review.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
