"use client";

import { useState, useEffect } from "react";
import { 
  ShoppingBag, Sliders, Folder, AlertTriangle, TrendingUp, DollarSign, 
  Calendar, Clock, Bell, User, CheckCircle2, ChevronRight, Loader2
} from "lucide-react";
import Link from "next/link";

interface MerchantCategory {
  id: string;
  name: string;
}

interface MerchantProduct {
  id: string;
  name: string;
  approvalStatus: string;
  status: string;
  inventories: { quantity: number; minimumStock: number }[];
}

export default function MerchantDashboard() {
  const [categories, setCategories] = useState<MerchantCategory[]>([]);
  const [products, setProducts] = useState<MerchantProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch("/api/merchant/categories"),
          fetch("/api/merchant/products")
        ]);

        if (!catRes.ok || !prodRes.ok) {
          throw new Error("Failed to load dashboard parameters.");
        }

        const catData = await catRes.json();
        const prodData = await prodRes.json();

        setCategories(catData);
        setProducts(prodData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-2xl w-1/3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  // Calculate metrics
  const totalCategories = categories.length;
  const totalProducts = products.length;
  const pendingRequests = products.filter(p => p.approvalStatus === "PENDING").length;
  const approvedProducts = products.filter(p => p.approvalStatus === "APPROVED").length;
  const rejectedProducts = products.filter(p => p.approvalStatus === "REJECTED").length;
  const returnedProducts = products.filter(p => p.approvalStatus === "RETURNED").length;

  let lowStockProducts = 0;
  let outOfStockProducts = 0;

  products.forEach(p => {
    const qty = p.inventories.reduce((acc, inv) => acc + inv.quantity, 0);
    const minStock = p.inventories.reduce((acc, inv) => acc + inv.minimumStock, 0);

    if (qty === 0) {
      outOfStockProducts++;
    } else if (qty <= minStock) {
      lowStockProducts++;
    }
  });

  // Mock Sales Growth Data for UI chart
  const salesData = [1200, 1900, 1700, 2400, 3100, 2800, 3900];
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 p-6">
      
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Merchant Workspace</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Monitor your inventory levels, active listings, sales graphs, and Product Admin approval status.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4 hover:border-indigo-500/20 transition-all">
          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Products</p>
            <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">{approvedProducts}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4 hover:border-amber-500/20 transition-all">
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-650 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Requests</p>
            <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">{pendingRequests}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4 hover:border-rose-500/20 transition-all">
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-955/20 text-rose-650 dark:text-rose-450">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Low / Out of Stock</p>
            <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">
              {lowStockProducts} / {outOfStockProducts}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4 hover:border-indigo-500/20 transition-all">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-655 dark:text-slate-350">
            <Folder className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Categories</p>
            <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">{totalCategories}</p>
          </div>
        </div>

      </div>

      {/* Sales Growth Graph & Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Mock Sales Chart (SVG Vector Graph) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Sales Growth Forecast
            </h3>
            <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
              + 14% This Week
            </span>
          </div>

          {/* SVG Vector Chart */}
          <div className="relative pt-6 h-56 flex flex-col justify-end">
            <svg viewBox="0 0 700 200" className="w-full h-full">
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="50" x2="700" y2="50" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" />
              <line x1="0" y1="100" x2="700" y2="100" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" />
              <line x1="0" y1="150" x2="700" y2="150" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" />
              
              {/* Chart Path Area */}
              <path
                d="M 50,170 Q 150,110 250,130 T 450,70 T 650,40 L 650,190 L 50,190 Z"
                fill="url(#gradient)"
              />
              {/* Chart Line */}
              <path
                d="M 50,170 Q 150,110 250,130 T 450,70 T 650,40"
                fill="none"
                stroke="#4f46e5"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Nodes */}
              <circle cx="50" cy="170" r="5" fill="#4f46e5" />
              <circle cx="150" cy="120" r="5" fill="#4f46e5" />
              <circle cx="250" cy="130" r="5" fill="#4f46e5" />
              <circle cx="350" cy="98" r="5" fill="#4f46e5" />
              <circle cx="450" cy="70" r="5" fill="#4f46e5" />
              <circle cx="550" cy="55" r="5" fill="#4f46e5" />
              <circle cx="650" cy="40" r="5" fill="#4f46e5" />
            </svg>
            <div className="flex justify-between px-6 text-[9px] font-bold text-slate-400 mt-2">
              {labels.map(l => <span key={l}>{l}</span>)}
            </div>
          </div>
        </div>

        {/* Category breakdown & Low stock summary */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-500" /> System Action Links
          </h3>

          <div className="grid grid-cols-1 gap-3 pt-2">
            <Link 
              href="/admin/user/products" 
              className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/40 border hover:bg-slate-100 dark:hover:bg-slate-850 rounded-2xl transition-all group"
            >
              <span className="text-xs font-bold text-slate-750 dark:text-slate-200">Catalog Management</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link 
              href="/admin/user/inventory" 
              className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/40 border hover:bg-slate-100 dark:hover:bg-slate-850 rounded-2xl transition-all group"
            >
              <span className="text-xs font-bold text-slate-750 dark:text-slate-200">Adjust Stock Batches</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link 
              href="/admin/user/reports" 
              className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/40 border hover:bg-slate-100 dark:hover:bg-slate-850 rounded-2xl transition-all group"
            >
              <span className="text-xs font-bold text-slate-750 dark:text-slate-200">Sales Reports Exporter</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
