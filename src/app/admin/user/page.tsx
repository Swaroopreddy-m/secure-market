import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ShoppingBag, DollarSign, ListOrdered, TrendingUp, AlertTriangle } from "lucide-react";
import MerchantInventory from "@/components/admin/MerchantInventory";
import MerchantOrders from "@/components/admin/MerchantOrders";
import MerchantSettings from "@/components/admin/MerchantSettings";

interface UserShopDashboardProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function UserShopDashboard({ searchParams }: UserShopDashboardProps) {
  const session = await getServerSession(authOptions);

  if (!session || !["DEVELOPER", "SUPER_ADMIN", "USER"].includes(session.user.role)) {
    redirect("/");
  }

  const resolvedSearchParams = await searchParams;
  const tab = resolvedSearchParams?.tab || "dashboard";

  // Parse permissions
  const rights = session.user.department
    ? session.user.department.split(",").map(s => s.trim().toLowerCase())
    : [];
  const isDevOrSuper = session.user.role === "DEVELOPER" || session.user.role === "SUPER_ADMIN";

  const showDashboard = isDevOrSuper || rights.includes("user-dashboard");
  const showOrders = isDevOrSuper || rights.includes("orders");
  const showInventory = isDevOrSuper || rights.includes("inventory");
  const showSettings = isDevOrSuper || rights.includes("settings");

  // Fetch current merchant user record from database to find shop scope
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  const shopId = dbUser?.shopId || null;
  const appId = dbUser?.applicationId || null;

  // Query database scoped by shop and application properties
  const [storeProductsCount, allStoreProducts, shopDetails, allOrders] = await Promise.all([
    prisma.storeProduct.count({
      where: shopId ? { shopId } : undefined
    }),
    prisma.storeProduct.findMany({
      where: shopId ? { shopId } : undefined,
      orderBy: { createdAt: "desc" }
    }),
    shopId ? prisma.shop.findUnique({ where: { id: shopId } }) : null,
    prisma.order.findMany({
      where: shopId ? {
        items: {
          some: {
            product: {
              shopId: shopId
            }
          }
        }
      } : undefined,
      orderBy: { createdAt: "desc" },
      include: { 
        user: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })
  ]);

  const ordersCount = allOrders.length;
  // Calculate revenue based only on items belonging to this shop
  const totalSalesRevenue = allOrders.reduce((sum, ord) => {
    const shopItems = shopId 
      ? ord.items.filter(item => item.product.shopId === shopId)
      : ord.items;
    const shopTotal = shopItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    return sum + shopTotal;
  }, 0);

  // If no rights are assigned, show unauthorized permissions message
  if (!showDashboard && !showOrders && !showInventory && !showSettings) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4 text-center p-6 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl">
        <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-955/20 text-amber-500 flex items-center justify-center text-xl">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">Access Permissions Required</h3>
        <p className="text-xs text-slate-500 max-w-sm leading-normal">
          Your merchant account does not have access permissions configured. Please contact your Product Admin to assign dashboard, inventory, or order access rights.
        </p>
      </div>
    );
  }

  // ------------------ CONDITIONAL TAB RENDERING ------------------

  if (tab === "inventory" && showInventory) {
    return (
      <div className="space-y-6 animate-in fade-in duration-350">
        <div>
          <h2 className="text-2xl font-black text-slate-850 dark:text-slate-100 tracking-tight">Store Catalog & Inventory</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-450 mt-1">Add products, edit stock levels, update pricing, and upload images.</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
          <MerchantInventory initialProducts={allStoreProducts} />
        </div>
      </div>
    );
  }

  if (tab === "orders" && showOrders) {
    return (
      <div className="space-y-6 animate-in fade-in duration-350">
        <div>
          <h2 className="text-2xl font-black text-slate-850 dark:text-slate-100 tracking-tight">Fulfillment Orders</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-450 mt-1">Track incoming grocery requests, pack boxes, and update delivery statuses.</p>
        </div>
        <MerchantOrders initialOrders={allOrders} shopId={shopId} />
      </div>
    );
  }

  if (tab === "settings" && showSettings) {
    if (!shopDetails) {
      return (
        <div className="min-h-[30vh] flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-slate-900 border rounded-3xl">
          <p className="text-xs text-slate-500">No shop profile is associated with your merchant account.</p>
        </div>
      );
    }
    return (
      <div className="space-y-6 animate-in fade-in duration-350">
        <div>
          <h2 className="text-2xl font-black text-slate-855 dark:text-slate-100 tracking-tight">Shop Settings</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-450 mt-1">Configure your shop profile details, logos, and descriptions.</p>
        </div>
        <MerchantSettings shop={shopDetails} />
      </div>
    );
  }

  // DEFAULT VIEW: Dashboard / Overview
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-850 dark:text-slate-100 tracking-tight">
            Merchant Shop: {shopDetails?.name || session.user.name || "My Shop"}
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-450 mt-1">
            {shopDetails?.description || "Scope: Store catalog editing, stock levels checking, and order fulfillment."}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-955/20 border border-indigo-200/50 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-full text-xs font-bold shadow-sm w-fit">
          <TrendingUp className="w-4 h-4" /> Shop Status: {shopDetails?.status || "ACTIVE"}
        </div>
      </div>

      {/* Widgets Grid */}
      {showDashboard && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-655 flex-shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Active Inventory</p>
              <p className="text-xl font-black text-slate-855 dark:text-slate-100 mt-1">{storeProductsCount} Products</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 flex-shrink-0">
              <ListOrdered className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Customer Orders</p>
              <p className="text-xl font-black text-slate-855 dark:text-slate-100 mt-1">{ordersCount} Placed</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-655 flex-shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-455 uppercase tracking-widest">Shop Revenue</p>
              <p className="text-xl font-black text-slate-855 dark:text-slate-100 mt-1">₹{totalSalesRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Overview Table */}
      {showOrders && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                    <th className="pb-3">Shop Share</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-50 dark:divide-slate-800/50">
                  {allOrders.slice(0, 5).map((ord) => {
                    const shopItems = shopId 
                      ? ord.items.filter(item => item.product.shopId === shopId)
                      : ord.items;
                    const shopTotal = shopItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 font-mono text-[10px] text-slate-500">#{ord.id.slice(-8).toUpperCase()}</td>
                        <td className="py-3 font-bold text-slate-700 dark:text-slate-350">{ord.user?.name || "Guest"}</td>
                        <td className="py-3 text-slate-450 dark:text-slate-500 font-medium">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 font-extrabold text-indigo-650 dark:text-indigo-400">₹{shopTotal.toFixed(2)}</td>
                        <td className="py-3 text-right">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            ord.status === "DELIVERED"
                              ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                              : ord.status === "CANCELLED"
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-955/20 dark:text-rose-450"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-955/20 dark:text-amber-400"
                          }`}>
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {allOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">No orders recorded for your shop.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-4 flex flex-col justify-center text-center">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-655 rounded-full flex items-center justify-center text-2xl mx-auto">🥬</div>
            <h4 className="font-extrabold text-sm text-slate-855 dark:text-slate-100">Fulfill Grocery Stock</h4>
            <p className="text-xs text-slate-500 leading-normal">Keep pricing competitive and track incoming order notifications to ensure high customer retention rates.</p>
          </div>
        </div>
      )}
    </div>
  );
}
