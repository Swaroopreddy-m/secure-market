import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ConfirmUsersClient from "@/components/admin/ConfirmUsersClient";

export default async function ConfirmUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DEVELOPER") {
    redirect("/");
  }

  // Fetch pending Super Admin users (where userApprovalStatus is PENDING)
  const pendingUsers = await prisma.user.findMany({
    where: {
      role: "SUPER_ADMIN",
      userApprovalStatus: "PENDING"
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
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
    firstName: u.firstName,
    lastName: u.lastName,
    mobile: u.mobile,
    designation: u.designation,
    remarks: u.remarks,
    makerUsername: u.makerUsername,
    createdAt: u.createdAt.toISOString(),
    organization: u.organization
  }));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ConfirmUsersClient initialPendingUsers={mappedPending} />
    </div>
  );
}
