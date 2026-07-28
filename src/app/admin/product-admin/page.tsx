import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ShoppingBag, Tag, Cpu } from "lucide-react";
import ProductAdminTabs from "@/components/admin/ProductAdminTabs";

export default async function ProductAdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || !["DEVELOPER", "SUPER_ADMIN", "PRODUCT_ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  // Fetch initial collections
  const [products, merchants, customers, applications] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" }
    }),
    prisma.user.findMany({
      where: { role: "USER" },
      orderBy: { createdAt: "desc" }
    }),
    prisma.customer.findMany({
      select: { id: true, companyName: true, customerId: true }
    }),
    prisma.application.findMany({
      orderBy: { createdAt: "desc" }
    })
  ]);

  const categoriesCount = new Set(products.map(p => p.category)).size;
  const productionCount = products.filter(p => p.environment === "PRODUCTION").length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Product Catalog Dashboard</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Manage SaaS product tiers, catalog specifications, and merchant accounts.</p>
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
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Merchants/Shops</p>
            <p className="text-xl font-black text-slate-850 dark:text-slate-100 mt-1">{merchants.length} Active</p>
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

      {/* Tabs Switcher and Content */}
      <ProductAdminTabs
        initialProducts={products}
        initialMerchants={merchants}
        allCustomers={customers}
        initialApplications={applications}
      />
    </div>
  );
}
