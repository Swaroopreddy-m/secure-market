import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Allow access to admin portal for DEVELOPER, SUPER_ADMIN, and legacy ADMIN roles
  if (!session || !["DEVELOPER", "SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  // Map session user structure to pass to shell safely
  const sessionUser = {
    id: session.user.id || "",
    name: session.user.name || "System User",
    email: session.user.email || "",
    image: session.user.image || null,
    role: session.user.role
  };

  return (
    <AdminShell sessionUser={sessionUser}>
      {children}
    </AdminShell>
  );
}
