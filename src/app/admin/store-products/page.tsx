import prisma from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Plus, Edit, Trash2, Search, Filter, PackageX } from "lucide-react";

export default async function StoreProductsPage() {
  let products: any[] = [];
  try {
    products = await prisma.storeProduct.findMany({
      orderBy: { createdAt: "desc" }
    });
  } catch (error) {
    console.error("[ADMIN_STORE_PRODUCTS_FATAL]", error);
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Grocery Store Products</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Manage grocery catalog, prices, and inventory stock status.</p>
        </div>
        <Link 
          href="/admin/store-products/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" /> Add Grocery Product
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search grocery products by name or category..." 
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-5">Image</th>
                <th className="px-8 py-5">Details</th>
                <th className="px-8 py-5">Category</th>
                <th className="px-8 py-5">Price</th>
                <th className="px-8 py-5">Stock Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-800/50">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
                      <Image 
                        src={product.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop"} 
                        alt={product.name} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="font-bold text-slate-800 dark:text-slate-100">{product.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">ID: {product.id.slice(-8)}</div>
                  </td>
                  <td className="px-8 py-4">
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-350">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <div className="font-extrabold text-slate-800 dark:text-slate-100">₹{product.price}</div>
                    <div className="text-[9px] text-slate-400">per {product.unit}</div>
                  </td>
                  <td className="px-8 py-4">
                    {product.inStock ? (
                      <span className="flex items-center gap-1.5 text-green-600 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" /> In Stock
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-rose-500 font-bold opacity-75">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Out of Stock
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link 
                        href={`/admin/store-products/${product.id}`} 
                        className="p-2 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-600/30 transition-all"
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button 
                        className="p-2 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-rose-500 hover:border-rose-500/30 transition-all"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <PackageX className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-700 dark:text-slate-350">No products found</p>
                        <p className="text-[11px] text-slate-400">Add grocery items to display in storefront catalog.</p>
                      </div>
                      <Link href="/admin/store-products/new" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Add New Product</Link>
                    </div>
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
