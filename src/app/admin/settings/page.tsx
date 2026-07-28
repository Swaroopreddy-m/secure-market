import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Settings, Save, CheckCircle2, ShieldAlert } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !["DEVELOPER", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  const configurations = await prisma.configuration.findMany({
    orderBy: { key: "asc" }
  });

  async function updateSettingAction(formData: FormData) {
    "use server";
    try {
      const devSession = await getServerSession(authOptions);
      if (!devSession || !["DEVELOPER", "SUPER_ADMIN"].includes(devSession.user.role)) {
        throw new Error("Unauthorized");
      }

      const keys = Array.from(formData.keys()).filter(k => !k.startsWith("$"));
      
      for (const key of keys) {
        const value = formData.get(key) as string;
        await prisma.configuration.update({
          where: { key },
          data: { value }
        });
      }

      if (devSession?.user) {
        await prisma.auditLog.create({
          data: {
            userId: devSession.user.id,
            action: "UPDATE_CONFIG",
            module: "CONFIG",
            status: "SUCCESS",
            details: `Updated configurations keys: ${keys.join(", ")}`
          }
        });
      }

      revalidatePath("/admin/settings");
    } catch (e) {
      console.error("[SETTINGS_UPDATE_FAILED]", e);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">System Configurations</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Configure global SaaS security compliance rules, concurrent logins and session expirations.</p>
      </div>

      <form action={updateSettingAction} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/50">
          {configurations.map((config) => (
            <div key={config.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
              <div className="space-y-1 md:max-w-md">
                <span className="font-mono text-[10px] font-bold text-indigo-650 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400 px-2 py-0.5 rounded">
                  {config.key}
                </span>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-normal pt-1.5">{config.description || "No description provided."}</p>
              </div>
              
              <div className="w-full md:w-48">
                {config.key === "CONCURRENT_LOGIN_POLICY" ? (
                  <select 
                    name={config.key}
                    defaultValue={config.value}
                    className="w-full bg-background border border-input rounded-2xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-semibold"
                  >
                    <option value="FORCE_LOGOUT">FORCE_LOGOUT</option>
                    <option value="REJECT_LOGIN">REJECT_LOGIN</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    name={config.key}
                    defaultValue={config.value}
                    required
                    className="w-full bg-background border border-input rounded-2xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-mono font-semibold"
                  />
                )}
              </div>
            </div>
          ))}
          {configurations.length === 0 && (
            <div className="p-8 text-center text-slate-400 font-sans">
              No configuration variables found in database.
            </div>
          )}
        </div>

        {configurations.length > 0 && (
          <button 
            type="submit" 
            className="w-full flex items-center justify-center gap-2 bg-indigo-650 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold shadow-md shadow-indigo-650/20 active:scale-95 transition-all text-xs"
          >
            <Save className="w-4 h-4" /> Save Configuration Settings
          </button>
        )}
      </form>
    </div>
  );
}
