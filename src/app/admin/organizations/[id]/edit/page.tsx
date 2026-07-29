import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import OrganizationForm from "@/components/admin/OrganizationForm";

interface EditOrgPageProps {
  params: {
    id: string;
  };
}

export default async function EditOrganizationPage({ params }: EditOrgPageProps) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DEVELOPER") {
    redirect("/");
  }

  const { id } = params;

  const org = await prisma.organization.findUnique({
    where: { id }
  });

  if (!org) {
    notFound();
  }

  const mappedOrg = {
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
    type: org.type,
    remarks: org.remarks
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Edit Organization</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Update general settings, subscriptions, status levels, or billing terms for this tenant.</p>
      </div>
      <OrganizationForm initialData={mappedOrg} />
    </div>
  );
}
