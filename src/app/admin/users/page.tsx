import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserManagement from "@/components/admin/UserManagement";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session || !["DEVELOPER", "SUPER_ADMIN", "PRODUCT_ADMIN", "ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  // Fetch all users, roles, products, customers
  const role = session.user.role;
  const orgId = session.user.organizationId;

  let userWhereClause = {};
  let customerWhereClause = {};
  if (role !== "DEVELOPER") {
    userWhereClause = { organizationId: orgId };
    customerWhereClause = { organizationId: orgId };
  }

  const [dbUsers, roles, products, customers] = await Promise.all([
    prisma.user.findMany({
      where: userWhereClause,
      include: {
        assignedProducts: true,
        assignedCustomers: true
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.role.findMany({ select: { id: true, name: true } }),
    prisma.product.findMany({ select: { id: true, name: true, code: true } }),
    prisma.customer.findMany({
      where: customerWhereClause,
      select: { id: true, companyName: true, customerId: true }
    })
  ]);

  // Map users structure for table view
  const mappedUsers = dbUsers.map((u) => ({
    id: u.id,
    employeeId: u.employeeId,
    username: u.username,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department,
    status: u.status,
    lastLogin: u.lastLogin,
    assignedProducts: u.assignedProducts.map(p => ({ id: p.id, name: p.name, code: p.code })),
    assignedCustomers: u.assignedCustomers.map(c => ({ id: c.id, companyName: c.companyName, customerId: c.customerId }))
  }));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <UserManagement
        initialUsers={mappedUsers}
        allRoles={roles}
        allProducts={products}
        allCustomers={customers}
      />
    </div>
  );
}
