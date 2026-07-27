import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sliders, Save, ShieldAlert, Check } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function ConfigurationsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DEVELOPER") {
    redirect("/");
  }

  // Fetch all system configs
  const configs = await prisma.configuration.findMany({
    orderBy: { key: "asc" }
  });

  async function updateConfigAction(formData: FormData) {
    "use server";
    
    try {
      const keys = Array.from(formData.keys()).filter(k => !k.startsWith("$"));
      for (const key of keys) {
        const val = formData.get(key) as string;
        await prisma.configuration.update({
          where: { key },
          data: { value: val }
        });
      }
      
      // Log audit event
      const devSession = await getServerSession(authOptions);
      if (devSession?.user) {
        await prisma.auditLog.create({
          data: {
            userId: devSession.user.id,
            action: "UPDATE_CONFIG",
            module: "CONFIG",
            status: "SUCCESS",
            details: `Updated configurations: ${keys.join(", ")}`
          }
        });
      }

      revalidatePath("/admin/configurations");
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">System Feature Flags & Policies</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Configure global SaaS security policies, authentication logic, and rate limits.</p>
      </div>

      <form action={updateConfigAction} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-6">
        <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Active System Flags
        </h3>

        <div className="space-y-6 divide-y divide-slate-100 dark:divide-slate-800">
          {configs.map((c) => (
            <div key={c.id} className="pt-6 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-100 font-mono uppercase bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded-md">
                  {c.key}
                </span>
                <p className="text-[11px] text-slate-400 leading-normal">{c.description || "No description provided."}</p>
              </div>

              <div className="w-full md:w-64">
                {c.key === "CONCURRENT_LOGIN_POLICY" ? (
                  <select 
                    name={c.key} 
                    defaultValue={c.value}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold appearance-none"
                  >
                    <option value="FORCE_LOGOUT">FORCE_LOGOUT (Overwrite old JWTs)</option>
                    <option value="REJECT_LOGIN">REJECT_LOGIN (Block new logins)</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    name={c.key}
                    defaultValue={c.value}
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button 
            type="submit" 
            className="flex items-center gap-1.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
