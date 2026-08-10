"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Eye, Search, SlidersHorizontal, Sliders, Edit3, ArrowRight, Loader2, AlertCircle, ShoppingBag
} from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface Inventory {
  id: string;
  quantity: number;
  availableQuantity: number;
  status: string;
  approvalStatus: string;
}

interface Price {
  id: string;
  sellingPrice: number;
  status: string;
  approvalStatus: string;
}

interface Image {
  id: string;
  url: string;
  isPrimary: boolean;
  status: string;
}

interface Product {
  id: string;
  name: string;
  shortDescription: string;
  createdAt: string;
  updatedAt: string;
  approvalStatus: string;
  category: Category;
  inventories: Inventory[];
  prices: Price[];
  images: Image[];
}

export default function CheckItemsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/merchant/inventory");
      if (!res.ok) throw new Error("Failed to load inventory items.");
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Unique categories for filtering
  const categories = ["All", ...Array.from(new Set(products.map(p => p.category?.name).filter(Boolean)))];

  // Helper getters
  const getSellingPrice = (p: Product) => {
    const activePrice = p.prices.find(pr => pr.status === "ACTIVE") || p.prices[0];
    return activePrice ? activePrice.sellingPrice : 0;
  };

  const getStockCount = (p: Product) => {
    const activeInvs = p.inventories.filter(inv => inv.status === "ACTIVE");
    return activeInvs.reduce((acc, inv) => acc + inv.quantity, 0);
  };

  const getProductImage = (p: Product) => {
    const primaryImg = p.images.find(img => img.isPrimary) || p.images[0];
    return primaryImg ? primaryImg.url : "/images/products/placeholder.png";
  };

  const getAvailabilityStatus = (p: Product) => {
    const stock = getStockCount(p);
    const hasActiveInventory = p.inventories.some(inv => inv.status === "ACTIVE" && inv.quantity > 0);
    return hasActiveInventory && stock > 0 ? "Available" : "Out of Stock";
  };

  // Filter list
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.shortDescription?.toLowerCase().includes(search.toLowerCase()) ||
                          p.id.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "All" || p.category?.name === categoryFilter;
    
    const availability = getAvailabilityStatus(p);
    const matchesAvailability = availabilityFilter === "All" || 
                               (availabilityFilter === "Available" && availability === "Available") ||
                               (availabilityFilter === "Out of Stock" && availability === "Out of Stock");

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Check Items</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">View and manage stock, price, and status for your private store products.</p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/30 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-450 text-xs font-bold animate-in fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Filter toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search items by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
          
          {/* Category */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2 px-4 text-xs font-bold focus:outline-none text-foreground cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Availability */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Status:</span>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2 px-4 text-xs font-bold focus:outline-none text-foreground cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl py-16 px-6 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-955 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200/50 dark:border-slate-800/50">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">No inventory items found</h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">Either you haven't uploaded any products yet or no items match your search criteria.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/50">
                    <th className="p-4 px-6">Image</th>
                    <th className="p-4 px-6">Product Item</th>
                    <th className="p-4 px-6">Category</th>
                    <th className="p-4 px-6">Price</th>
                    <th className="p-4 px-6">Items Left</th>
                    <th className="p-4 px-6">Availability</th>
                    <th className="p-4 px-6">Sync Status</th>
                    <th className="p-4 px-6">Dates</th>
                    <th className="p-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-800/50">
                  {filteredProducts.map((p) => {
                    const price = getSellingPrice(p);
                    const stock = getStockCount(p);
                    const image = getProductImage(p);
                    const availability = getAvailabilityStatus(p);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="p-4 px-6">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-955 border border-slate-200/50 dark:border-slate-800/50">
                            <img src={image} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                        </td>
                        <td className="p-4 px-6">
                          <div className="max-w-[200px]">
                            <p className="font-extrabold text-slate-850 dark:text-slate-150 truncate" title={p.name}>{p.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5" title={p.shortDescription}>{p.shortDescription || "No description"}</p>
                          </div>
                        </td>
                        <td className="p-4 px-6 font-extrabold text-slate-600 dark:text-slate-400">
                          {p.category?.name || "Uncategorized"}
                        </td>
                        <td className="p-4 px-6 font-black text-slate-800 dark:text-slate-100">
                          ₹{price}
                        </td>
                        <td className="p-4 px-6 font-extrabold text-slate-700 dark:text-slate-300">
                          {stock}
                        </td>
                        <td className="p-4 px-6">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            availability === "Available"
                              ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400"
                              : "bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400"
                          }`}>
                            {availability}
                          </span>
                        </td>
                        <td className="p-4 px-6">
                          <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            p.approvalStatus === "APPROVED"
                              ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                              : "bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-400"
                          }`}>
                            {p.approvalStatus === "APPROVED" ? "PUBLISHED" : p.approvalStatus}
                          </span>
                        </td>
                        <td className="p-4 px-6 text-slate-400 font-bold text-[10px]">
                          <div>C: {new Date(p.createdAt).toLocaleDateString()}</div>
                          <div className="mt-0.5">U: {new Date(p.updatedAt).toLocaleDateString()}</div>
                        </td>
                        <td className="p-4 px-6 text-right">
                          <Link
                            href={`/admin/user/inventory-edit?id=${p.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer font-bold text-[10px]"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden grid md:grid-cols-2 gap-4">
            {filteredProducts.map((p) => {
              const price = getSellingPrice(p);
              const stock = getStockCount(p);
              const image = getProductImage(p);
              const availability = getAvailabilityStatus(p);

              return (
                <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-4 flex gap-4 shadow-sm relative overflow-hidden">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-955 border border-slate-200/50 dark:border-slate-800/50 flex-shrink-0">
                    <img src={image} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[9px] uppercase font-black text-primary tracking-widest">{p.category?.name || "Uncategorized"}</span>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[7px] font-black uppercase ${
                        p.approvalStatus === "APPROVED" ? "bg-indigo-50 text-indigo-600" : "bg-amber-50 text-amber-600"
                      }`}>
                        {p.approvalStatus === "APPROVED" ? "PUBLISHED" : p.approvalStatus}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-slate-800 dark:text-slate-150 truncate mt-0.5">{p.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold truncate">{p.shortDescription || "No description"}</p>
                    
                    <div className="flex items-center gap-3 mt-2">
                      <span className="font-black text-slate-900 dark:text-slate-100">₹{price}</span>
                      <span className="text-[10px] font-bold text-slate-400">Items Left: <strong className="text-slate-700 dark:text-slate-200">{stock}</strong></span>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/50">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                        availability === "Available" ? "bg-green-50 text-green-600" : "bg-rose-50 text-rose-600"
                      }`}>
                        {availability}
                      </span>

                      <Link
                        href={`/admin/user/inventory-edit?id=${p.id}`}
                        className="inline-flex items-center gap-1 text-[10px] font-black text-primary hover:underline"
                      >
                        Edit Item <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
