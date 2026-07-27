import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ShoppingBag, Tag, Cpu, ClipboardList, Plus, FileText, CheckCircle } from "lucide-react";

export default async function ProductAdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || !["DEVELOPER", "SUPER_ADMIN", "PRODUCT_ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  const products = await prisma.product.findMany({
    orderBy: { category: "asc" }
  });

  const categoriesCount = new Set(products.map(p => p.category)).size;
  const productionCount = products.filter(p => p.environment === "PRODUCTION").length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Product Catalog Admin</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Manage SaaS product tiers, catalog specifications, and documentation links.</p>
        </div>
        <button className="flex items-center gap-1.5 px-5 py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-650/20 active:scale-95 transition-all">
          <Plus className="w-4 h-4" /> Add Product Offering
        </button>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 flex-shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SaaS Products</p>
            <p className="text-xl font-black text-slate-850 dark:text-slate-100 mt-1">{products.length} Offerings</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-650 flex-shrink-0">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categories</p>
            <p className="text-xl font-black text-slate-850 dark:text-slate-100 mt-1">{categoriesCount} Categories</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 flex-shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Production Env</p>
            <p className="text-xl font-black text-slate-850 dark:text-slate-100 mt-1">{productionCount} Active</p>
          </div>
        </div>
      </div>

      {/* Catalog table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/50">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Product Offerings Catalog</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900/50">
                <th className="p-4 px-6">Product</th>
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
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 flex items-center gap-1 w-fit ml-auto">
                      <CheckCircle className="w-3 h-3" /> {prod.status}
                    </span>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">No SaaS products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
