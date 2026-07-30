import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ReportsClient from "@/components/admin/ReportsClient";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !["DEVELOPER", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  const role = session.user.role;
  const orgId = session.user.organizationId || "";

  // Developer has access to all, Super Admin is isolated to their own organization
  let userWhere: any = { role: "PRODUCT_ADMIN" };
  let appWhere: any = {};

  if (role === "SUPER_ADMIN") {
    userWhere.organizationId = orgId;
    appWhere.organizationId = orgId;
  }

  const [productAdmins, applications] = await Promise.all([
    prisma.user.findMany({
      where: userWhere,
      include: {
        application: {
          select: { name: true, id: true }
        },
        organization: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.application.findMany({
      where: appWhere,
      include: {
        users: {
          where: { role: "PRODUCT_ADMIN" }
        }
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  // Format dates safely
  const formattedAdmins = productAdmins.map((user) => ({
    id: user.id,
    employeeId: user.employeeId || "N/A",
    username: user.username || "",
    name: user.name || "",
    email: user.email || "",
    status: user.status,
    userApprovalStatus: user.userApprovalStatus || "DRAFT",
    roleMatrixStatus: user.roleMatrixStatus || "DRAFT",
    department: user.department || "None",
    designation: user.designation || "N/A",
    createdAt: user.createdAt.toISOString(),
    applicationName: user.application?.name || "Unassigned",
    organizationName: user.organization?.name || "System"
  }));

  const formattedApps = applications.map((app) => ({
    id: app.id,
    name: app.name,
    description: app.description || "",
    createdAt: app.createdAt.toISOString(),
    status: "ACTIVE",
    productAdminsCount: app.users.length
  }));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ReportsClient 
        initialAdmins={formattedAdmins}
        initialApps={formattedApps}
        orgName={role === "SUPER_ADMIN" ? (formattedAdmins[0]?.organizationName || "Your Org") : "System Developer View"}
      />
    </div>
  );
}
