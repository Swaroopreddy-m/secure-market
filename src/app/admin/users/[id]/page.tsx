import UserForm from "@/components/admin/UserForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !["DEVELOPER", "SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  const { id } = await params;
  
  // Fetch user, roles, products, customers
  const [user, roles, products, customers] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: {
        assignedProducts: { select: { id: true } },
        assignedCustomers: { select: { id: true } }
      }
    }),
    prisma.role.findMany({ select: { id: true, name: true } }),
    prisma.product.findMany({ select: { id: true, name: true, code: true } }),
    prisma.customer.findMany({ select: { id: true, companyName: true, customerId: true } })
  ]);

  if (!user) {
    notFound();
  }

  // Map user data for edit page safely
  const mappedUser = {
    id: user.id,
    employeeId: user.employeeId,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    status: user.status,
    assignedProducts: user.assignedProducts.map(p => ({ id: p.id })),
    assignedCustomers: user.assignedCustomers.map(c => ({ id: c.id }))
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <Link 
          href="/admin/users" 
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Users
        </Link>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Edit User Account</h2>
        <p className="text-xs text-slate-500">Update departments, logins, role status or project assignment scopes.</p>
      </div>

      <UserForm 
        initialData={mappedUser}
        allRoles={roles}
        allProducts={products}
        allCustomers={customers}
      />
    </div>
  );
}
