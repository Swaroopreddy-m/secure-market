import UserForm from "@/components/admin/UserForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function NewUserPage() {
  const session = await getServerSession(authOptions);

  if (!session || !["DEVELOPER", "SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  // Fetch roles, products, customers
  const [roles, products, customers] = await Promise.all([
    prisma.role.findMany({ select: { id: true, name: true } }),
    prisma.product.findMany({ select: { id: true, name: true, code: true } }),
    prisma.customer.findMany({ select: { id: true, companyName: true, customerId: true } })
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <Link 
          href="/admin/users" 
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Users
        </Link>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Create Enterprise Account</h2>
        <p className="text-xs text-slate-500">Provision a new user credential mapping to departments, customers, and product modules.</p>
      </div>

      <UserForm 
        allRoles={roles}
        allProducts={products}
        allCustomers={customers}
      />
    </div>
  );
}
