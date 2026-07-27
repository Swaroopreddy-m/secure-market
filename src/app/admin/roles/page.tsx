import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PermissionMatrix from "@/components/admin/PermissionMatrix";

export default async function AdminRolesMatrixPage() {
  const session = await getServerSession(authOptions);

  // Only DEVELOPER has access to adjust global RBAC configs
  if (!session || session.user.role !== "DEVELOPER") {
    redirect("/");
  }

  // Fetch roles, permissions, and mappings
  const [roles, permissions, mappings] = await Promise.all([
    prisma.role.findMany({ orderBy: { name: "asc" } }),
    prisma.permission.findMany({ orderBy: { module: "asc" } }),
    prisma.rolePermission.findMany({
      select: { roleId: true, permissionId: true }
    })
  ]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PermissionMatrix
        roles={roles.map(r => ({ id: r.id, name: r.name, description: r.description }))}
        permissions={permissions.map(p => ({ id: p.id, name: p.name, module: p.module, description: p.description }))}
        initialMappings={mappings}
      />
    </div>
  );
}
