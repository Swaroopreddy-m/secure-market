import CustomerForm from "@/components/admin/CustomerForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function NewCustomerPage() {
  const session = await getServerSession(authOptions);

  if (!session || !["DEVELOPER", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <Link 
          href="/admin/customers" 
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Customers
        </Link>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Provision New Tenant</h2>
        <p className="text-xs text-slate-500">Add a new organization to the system to enable service subscriptions and licenses.</p>
      </div>

      <CustomerForm />
    </div>
  );
}
