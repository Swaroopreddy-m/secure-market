import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Save, ShieldAlert, CheckCircle2 } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !["DEVELOPER", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  // Fetch only the relevant maker checker configurations
  const makerCheckerConfig = await prisma.configuration.findUnique({
    where: { key: "MAKER_CHECKER_CHECKER_ENABLED" }
  });

  const dualApprovalConfig = await prisma.configuration.findUnique({
    where: { key: "MAKER_CHECKER_DUAL_APPROVAL" }
  });

  const checkerValue = makerCheckerConfig?.value || "true";
  const dualApprovalValue = dualApprovalConfig?.value || "true";

  async function updateSettingAction(formData: FormData) {
    "use server";
    try {
      const devSession = await getServerSession(authOptions);
      if (!devSession || !["DEVELOPER", "SUPER_ADMIN"].includes(devSession.user.role)) {
        throw new Error("Unauthorized");
      }

      const makerCheckerVal = formData.get("MAKER_CHECKER_CHECKER_ENABLED") as string;
      const sameMakerCheckerVal = formData.get("MAKER_CHECKER_DUAL_APPROVAL") as string;

      // Update MAKER_CHECKER_CHECKER_ENABLED
      await prisma.configuration.update({
        where: { key: "MAKER_CHECKER_CHECKER_ENABLED" },
        data: { value: makerCheckerVal }
      });

      // Synchronize with merchant checker settings to be identical
      await prisma.configuration.update({
        where: { key: "ENABLE_PRODUCT_MAKER_CHECKER" },
        data: { value: makerCheckerVal }
      });
      await prisma.configuration.update({
        where: { key: "DEFAULT_APPROVAL_MODE" },
        data: { value: makerCheckerVal === "true" ? "MAKER_CHECKER" : "DIRECT_PUBLISH" }
      });

      // Update MAKER_CHECKER_DUAL_APPROVAL
      await prisma.configuration.update({
        where: { key: "MAKER_CHECKER_DUAL_APPROVAL" },
        data: { value: sameMakerCheckerVal }
      });

      if (devSession?.user) {
        await prisma.auditLog.create({
          data: {
            userId: devSession.user.id,
            action: "UPDATE_CONFIG",
            module: "CONFIG",
            status: "SUCCESS",
            details: `Updated configurations keys: MAKER_CHECKER_CHECKER_ENABLED = ${makerCheckerVal}, MAKER_CHECKER_DUAL_APPROVAL = ${sameMakerCheckerVal}`
          }
        });
      }

      revalidatePath("/admin/settings");
    } catch (e) {
      console.error("[SETTINGS_UPDATE_FAILED]", e);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto p-6">
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">System Settings</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Configure global Maker-Checker workflow constraints and approval overrides.</p>
      </div>

      <form action={updateSettingAction} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/50">
          
          {/* Maker & Checker Select */}
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
            <div className="space-y-1 md:max-w-md">
              <span className="font-mono text-[10px] font-bold text-indigo-655 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400 px-2 py-0.5 rounded">
                Maker & Checker
              </span>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-normal pt-1.5">
                If enabled, records will be shared to another confirm tabs for approval. If disabled, direct confirmation is applied for all users.
              </p>
            </div>
            
            <div className="w-full md:w-56">
              <select 
                name="MAKER_CHECKER_CHECKER_ENABLED"
                defaultValue={checkerValue}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-2xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-semibold text-slate-800 dark:text-slate-100"
              >
                <option value="true">ENABLE</option>
                <option value="false">DISABLE</option>
              </select>
            </div>
          </div>

          {/* Same Maker & Checker Select */}
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
            <div className="space-y-1 md:max-w-md">
              <span className="font-mono text-[10px] font-bold text-indigo-655 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400 px-2 py-0.5 rounded">
                Same Maker & Checker
              </span>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-normal pt-1.5">
                If enabled, the same person who created or modified the record can perform the checker confirmation step.
              </p>
            </div>
            
            <div className="w-full md:w-56">
              <select 
                name="MAKER_CHECKER_DUAL_APPROVAL"
                defaultValue={dualApprovalValue}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-2xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-semibold text-slate-800 dark:text-slate-100"
              >
                {/* Note: If enabled, dual approval constraint is disabled (same person can confirm) so value is 'false' */}
                <option value="false">ENABLE (Same person can confirm)</option>
                <option value="true">DISABLE (Different person required)</option>
              </select>
            </div>
          </div>

        </div>

        <button 
          type="submit" 
          className="w-full flex items-center justify-center gap-2 bg-indigo-650 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold shadow-md shadow-indigo-650/20 active:scale-95 transition-all text-xs cursor-pointer"
        >
          <Save className="w-4 h-4" /> Save Configuration Settings
        </button>
      </form>
    </div>
  );
}
