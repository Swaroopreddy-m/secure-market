import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ConfirmPermissionsClient from "@/components/admin/ConfirmPermissionsClient";

export default async function ConfirmPermissionsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DEVELOPER") {
    redirect("/");
  }

  // Fetch all users with pending permission matrices
  const pendingUsers = await prisma.user.findMany({
    where: {
      role: "SUPER_ADMIN",
      roleMatrixStatus: "PENDING"
    },
    include: {
      superAdminPermissions: {
        where: { status: "PENDING_CONFIRMATION" }
      },
      organization: {
        select: {
          name: true,
          code: true
        }
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  // Map users structure for table view safely
  const mappedPending = pendingUsers.map((u) => ({
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
    makerUsername: u.makerUsername,
    checkerUsername: u.checkerUsername,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    organization: u.organization,
    superAdminPermissions: u.superAdminPermissions.map(p => ({
      id: p.id,
      module: p.module,
      action: p.action,
      status: p.status,
      makerUsername: p.makerUsername
    }))
  }));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ConfirmPermissionsClient initialPendingUsers={mappedPending} />
    </div>
  );
}
