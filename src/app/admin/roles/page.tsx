import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import MakerRolesMatrix from "@/components/admin/MakerRolesMatrix";

export default async function AdminRolesMatrixPage() {
  const session = await getServerSession(authOptions);

  // Only DEVELOPER has access to adjust Super Admin permissions matrix
  if (!session || session.user.role !== "DEVELOPER") {
    redirect("/");
  }

  // Fetch all Super Admin users
  const superAdmins = await prisma.user.findMany({
    where: { role: "SUPER_ADMIN" },
    select: {
      id: true,
      employeeId: true,
      username: true,
      name: true,
      roleMatrixStatus: true
    },
    orderBy: { username: "asc" }
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Super Admin Role Permission Matrix</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Map granular permissions to target Super Admin user accounts across all modules.</p>
      </div>
      
      <MakerRolesMatrix superAdmins={superAdmins} />
    </div>
  );
}
