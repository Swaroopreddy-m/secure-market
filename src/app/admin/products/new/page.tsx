import SaaSProductForm from "@/components/admin/SaaSProductForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function NewSaaSProductPage() {
  const session = await getServerSession(authOptions);

  if (!session || !["DEVELOPER", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <Link 
          href="/admin/products" 
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to SaaS Products
        </Link>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Deploy New SaaS Module</h2>
        <p className="text-xs text-slate-500 font-medium">Provision a new product offering across organizations and customers.</p>
      </div>

      <SaaSProductForm />
    </div>
  );
}
