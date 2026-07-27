import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ShoppingBag, DollarSign, ListOrdered, ClipboardList, CheckCircle, TrendingUp } from "lucide-react";

export default async function UserShopDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || !["DEVELOPER", "SUPER_ADMIN", "USER"].includes(session.user.role)) {
    redirect("/");
  }

  // Fetch shop statistics from SQLite DB
  const [storeProductsCount, ordersCount, recentOrders] = await Promise.all([
    prisma.storeProduct.count(),
    prisma.order.count(),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: true }
    })
  ]);

  const totalSalesRevenue = recentOrders.reduce((sum, ord) => sum + ord.totalAmount, 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Merchant Shop: {session.user.name}</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Merchant dashboard to edit grocery products, check stock levels, and fulfill customer orders.</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-full text-xs font-bold shadow-sm w-fit">
          <TrendingUp className="w-4 h-4" /> Shop Status: ACTIVE
        </div>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 flex-shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Inventory</p>
            <p className="text-xl font-black text-slate-850 dark:text-slate-100 mt-1">{storeProductsCount} Products</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 flex-shrink-0">
            <ListOrdered className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer Orders</p>
            <p className="text-xl font-black text-slate-850 dark:text-slate-100 mt-1">{ordersCount} Placed</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-650 flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recent Sales Volume</p>
            <p className="text-xl font-black text-slate-850 dark:text-slate-100 mt-1">₹{totalSalesRevenue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Recent Customer Orders</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                  <th className="pb-3">Order ID</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Total Amount</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-50 dark:divide-slate-800/50">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 font-mono text-[10px] text-slate-500">#{ord.id.slice(-8)}</td>
                    <td className="py-3 font-bold text-slate-700 dark:text-slate-350">{ord.user.name || "Guest"}</td>
                    <td className="py-3 text-slate-400 dark:text-slate-500">
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 font-extrabold text-slate-750 dark:text-slate-250">₹{ord.totalAmount}</td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        ord.status === "DELIVERED"
                          ? "bg-green-100 text-green-700 dark:bg-green-950/30"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950/30"
                      }`}>
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">No recent orders recorded for this shop.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-4 flex flex-col justify-center text-center">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 rounded-full flex items-center justify-center text-2xl mx-auto">🥬</div>
          <h4 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">Fulfill Grocery Stock</h4>
          <p className="text-xs text-slate-500 leading-normal">Keep pricing competitive and track incoming order notifications to ensure high customer retention rates.</p>
        </div>
      </div>
    </div>
  );
}
