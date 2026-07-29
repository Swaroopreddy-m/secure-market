import MakerUserWorkspace from "@/components/admin/MakerUserWorkspace";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function NewUserPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DEVELOPER") {
    redirect("/");
  }

  // Fetch active organizations and Super Admin users
  const [organizations, saasUsers] = await Promise.all([
    prisma.organization.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, code: true }
    }),
    prisma.user.findMany({
      where: { role: "SUPER_ADMIN" },
      orderBy: { createdAt: "desc" }
    })
  ]);

  // Map users lifecycle records safely
  const mappedUsers = saasUsers.map((u) => ({
    id: u.id,
    employeeId: u.employeeId,
    username: u.username,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department,
    status: u.status,
    userApprovalStatus: u.userApprovalStatus,
    roleMatrixStatus: u.roleMatrixStatus,
    firstName: u.firstName,
    lastName: u.lastName,
    mobile: u.mobile,
    designation: u.designation,
    remarks: u.remarks,
    organizationId: u.organizationId,
    createdAt: u.createdAt.toISOString()
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <Link 
          href="/admin" 
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-650 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Super Admin Accounts (Maker)</h2>
        <p className="text-xs text-slate-500">Draft, configure and submit Super Admin users for Checker confirmation and lifecycle activation.</p>
      </div>

      <MakerUserWorkspace 
        organizations={organizations}
        initialUsers={mappedUsers}
      />
    </div>
  );
}
