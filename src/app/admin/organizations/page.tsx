import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Building2, ShieldCheck, Plus, CheckCircle, Clock } from "lucide-react";

export default async function OrganizationsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DEVELOPER") {
    redirect("/");
  }

  const organizations = await prisma.organization.findMany({
    include: {
      customers: true,
      users: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">SaaS Organizations</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">View and manage SaaS tenant organizations and active subscriptions.</p>
        </div>
        <button className="flex items-center gap-1.5 px-5 py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-650/20 active:scale-95 transition-all">
          <Plus className="w-4 h-4" /> Provision Organization
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 bg-slate-50 dark:bg-slate-900/50">
                <th className="p-4 px-6">Org Name</th>
                <th className="p-4 px-6">Org Code</th>
                <th className="p-4 px-6">Provisioned At</th>
                <th className="p-4 px-6">Associated Tenants</th>
                <th className="p-4 px-6">Total Users</th>
                <th className="p-4 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-800/50">
              {organizations.map((org) => (
                <tr key={org.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="p-4 px-6 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-500" />
                    {org.name}
                  </td>
                  <td className="p-4 px-6 font-mono text-[10px] text-slate-500">{org.code}</td>
                  <td className="p-4 px-6 text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(org.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </td>
                  <td className="p-4 px-6 font-semibold text-slate-700 dark:text-slate-300">
                    {org.customers.length} Tenants
                  </td>
                  <td className="p-4 px-6 font-semibold text-slate-700 dark:text-slate-300">
                    {org.users.length} Users
                  </td>
                  <td className="p-4 px-6 text-right">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 flex items-center gap-1 w-fit ml-auto">
                      <CheckCircle className="w-3 h-3" /> ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
              {organizations.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">No organizations found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
