import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { 
  Plus, Edit, Trash2, Search, Filter, ShieldCheck, Cpu, 
  ExternalLink, Copy, Archive, Settings, FileText, CheckCircle2,
  AlertCircle, HelpCircle, PackageX, Sliders
} from "lucide-react";

export default async function SaaSProductsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !["DEVELOPER", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  const role = session.user.role;
  const isDeveloper = role === "DEVELOPER";

  let products: any[] = [];
  try {
    // Fetch products along with subscription (customer) counts and user counts
    products = await prisma.product.findMany({
      include: {
        subscriptions: {
          include: { customer: true }
        },
        assignedUsers: true
      },
      orderBy: { code: "asc" }
    });
  } catch (error) {
    console.error("[SAAS_PRODUCTS_FETCH]", error);
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">SaaS Application Modules</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Evolve product offerings, configure settings, and monitor deployments.</p>
        </div>
        <Link 
          href="/admin/products/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" /> Create SaaS Product
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search products by code, name or category..." 
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {products.map((p) => {
          const customerCount = p.subscriptions.length;
          const userCount = p.assignedUsers.length;
          
          return (
            <div key={p.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all group">
              <div className="space-y-4">
                {/* Product Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {p.code}
                    </span>
                    <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {p.name}
                    </h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                    p.status === "ACTIVE" 
                      ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" 
                      : p.status === "ARCHIVED" 
                      ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" 
                      : "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                  }`}>
                    {p.status}
                  </span>
                </div>

                {/* Description */}
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed min-h-[40px] line-clamp-2">
                  {p.description || "No description provided."}
                </p>

                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/50 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-slate-400">Owner</span>
                    <span className="text-slate-700 dark:text-slate-350">{p.owner}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-slate-400">Environment</span>
                    <span className="text-slate-700 dark:text-slate-350 flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-indigo-500" /> {p.environment}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-slate-400">Assigned Customers</span>
                    <span className="text-slate-800 dark:text-slate-200 text-xs font-black">{customerCount}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-slate-400">Total Users</span>
                    <span className="text-slate-800 dark:text-slate-200 text-xs font-black">{userCount}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800/50 mt-6 flex items-center justify-between gap-4">
                <div className="flex gap-2">
                  {p.documentationUrl && (
                    <a 
                      href={p.documentationUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      title="Documentation"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {isDeveloper && (
                    <>
                      <button 
                        className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        title="Clone Product"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        title="Archive Product"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  {isDeveloper ? (
                    <>
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-750 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 transition-all"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </Link>
                      <button
                        className="p-2 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 border border-slate-200 dark:border-slate-750 text-slate-400 hover:text-red-500 hover:border-red-500/25 rounded-xl transition-all"
                        title="Delete Product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/10">
                      <Sliders className="w-3.5 h-3.5" /> Assign Modules
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })}

        {products.length === 0 && (
          <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-16 rounded-3xl text-center flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 bg-slate-50 dark:bg-slate-850 rounded-full flex items-center justify-center">
              <PackageX className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <p className="font-extrabold text-slate-800 dark:text-slate-100 text-base">No SaaS Products found</p>
              <p className="text-xs text-slate-500">Seed the database or add your first product module above.</p>
            </div>
            <Link href="/admin/products/new" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Add New Product</Link>
          </div>
        )}
      </div>

    </div>
  );
}
