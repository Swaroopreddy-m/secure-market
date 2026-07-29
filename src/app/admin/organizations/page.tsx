import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import OrganizationList from "@/components/admin/OrganizationList";

export default async function OrganizationsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DEVELOPER") {
    redirect("/");
  }

  const organizations = await prisma.organization.findMany({
    include: {
      customers: true,
      users: {
        where: { role: "SUPER_ADMIN" },
        select: { id: true, name: true, email: true, username: true }
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Map to match component expectations
  const mappedOrgs = organizations.map((org) => ({
    id: org.id,
    name: org.name,
    code: org.code,
    logo: org.logo,
    description: org.description,
    subscription: org.subscription,
    theme: org.theme,
    status: org.status,
    owner: org.owner,
    expiryDate: org.expiryDate ? org.expiryDate.toISOString() : null,
    domain: org.domain,
    createdAt: org.createdAt.toISOString(),
    users: org.users,
    customers: org.customers
  }));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <OrganizationList initialOrgs={mappedOrgs} />
    </div>
  );
}
