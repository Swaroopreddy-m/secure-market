"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console or error reporting service
    console.error("Storefront Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-8 shadow-xl text-center space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-inter tracking-tight text-slate-900 dark:text-slate-105">
            Something went wrong!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            An unexpected error occurred while loading this page. Our team has been notified.
          </p>
          {error.message && (
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 rounded-xl p-3 text-xs font-mono text-left max-h-24 overflow-auto text-slate-650 dark:text-slate-400 mt-4">
              <span className="font-bold text-rose-500">Error:</span> {error.message}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 bg-indigo-650 hover:bg-indigo-700 text-white py-3 px-4 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-650/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
          
          <Link
            href="/"
            className="flex-1 bg-slate-105 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 px-4 rounded-2xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-750 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> Store Home
          </Link>
        </div>
      </div>
    </div>
  );
}
