import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import OrganizationForm from "@/components/admin/OrganizationForm";

export default async function NewOrganizationPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DEVELOPER") {
    redirect("/");
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Provision New Organization</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Establish a new tenant system, configure subscription features, and assign a Super Administrator.</p>
      </div>
      <OrganizationForm />
    </div>
  );
}
