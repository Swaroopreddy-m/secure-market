import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { 
  Plus, Edit, Trash2, Search, Building2, User, Mail, Phone, Calendar,
  Activity, ShieldCheck, CheckCircle2, AlertTriangle, HelpCircle, PackageX
} from "lucide-react";

export default async function CustomersPage() {
  const session = await getServerSession(authOptions);

  if (!session || !["DEVELOPER", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  let customers: any[] = [];
  try {
    customers = await prisma.customer.findMany({
      include: {
        subscriptions: {
          include: { product: true }
        },
        licenses: true,
        users: true
      },
      orderBy: { companyName: "asc" }
    });
  } catch (error) {
    console.error("[CUSTOMERS_FETCH]", error);
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Enterprise Customers</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Manage tenant profiles, active subscriptions, and user licensing scopes.</p>
        </div>
        <Link 
          href="/admin/customers/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search customers by ID, company name or contact email..." 
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
      </div>

      {/* Customers List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-5">Company / ID</th>
                <th className="px-8 py-5">Type / Location</th>
                <th className="px-8 py-5">Contact</th>
                <th className="px-8 py-5">Subscriptions</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-800/50">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="font-bold text-slate-800 dark:text-slate-100">{c.companyName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">ID: {c.customerId}</div>
                  </td>
                  <td className="px-8 py-4">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] font-black uppercase text-slate-600 dark:text-slate-350 block w-fit mb-1">
                      {c.type}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{c.city}, {c.country}</span>
                  </td>
                  <td className="px-8 py-4 space-y-0.5">
                    <div className="font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" /> {c.contactPerson}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> {c.email}
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex flex-wrap gap-1">
                      {c.subscriptions.map((s: any) => (
                        <span key={s.id} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-md text-[9px] font-extrabold uppercase">
                          {s.product.name}
                        </span>
                      ))}
                      {c.subscriptions.length === 0 && (
                        <span className="text-[10px] text-slate-450 italic">None Active</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      c.status === "ACTIVE" 
                        ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" 
                        : "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link 
                        href={`/admin/customers/${c.id}`} 
                        className="p-2 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-600/30 transition-all"
                        title="Edit Customer"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button 
                        className="p-2 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-rose-500 hover:border-rose-500/30 transition-all"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-700 dark:text-slate-350">No customer profiles found</p>
                        <p className="text-[11px] text-slate-400">Add tenant companies or organizations to assign SaaS subscriptions.</p>
                      </div>
                      <Link href="/admin/customers/new" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Add New Customer</Link>
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
