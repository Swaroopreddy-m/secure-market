"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin Dashboard Error:", error);
  }, [error]);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm flex flex-col items-center text-center space-y-6">
        <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 rounded-2xl flex items-center justify-center shadow-inner">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
            Admin Panel Exception
          </h2>
          <p className="text-xs text-slate-500 max-w-md">
            An error occurred while loading this administrative view. Please retry or contact technical support.
          </p>
          {error.message && (
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 rounded-xl p-4 text-xs font-mono text-left max-h-40 overflow-auto text-slate-600 dark:text-slate-400 mt-4 max-w-lg w-full">
              <span className="font-bold text-rose-500">Trace:</span> {error.message}
            </div>
          )}
        </div>

        <div className="flex gap-3 w-full max-w-sm">
          <button
            onClick={() => reset()}
            className="flex-1 bg-indigo-650 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Retry Loading
          </button>
          
          <Link
            href="/admin"
            className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-750 transition-all flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" /> Admin Home
          </Link>
        </div>
      </div>
    </div>
  );
}
