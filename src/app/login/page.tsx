"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Eye, EyeOff, Lock, User, Sparkles } from "lucide-react";

function LoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      const role = session.user.role;
      const redirectParam = searchParams.get("redirect");

      if (redirectParam) {
        router.push(redirectParam);
        return;
      }

      if (role === "DEVELOPER" || role === "SUPER_ADMIN" || role === "ADMIN") {
        router.push("/admin");
      } else if (role === "PRODUCT_ADMIN") {
        router.push("/admin/product-admin");
      } else if (role === "USER") {
        router.push("/admin/user");
      } else {
        router.push("/");
      }
    }
  }, [status, session, router, searchParams]);

  // Read saved username if Remember Me was selected
  useEffect(() => {
    const savedUsername = localStorage.getItem("rememberedUsername");
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError(null);

    if (rememberMe) {
      localStorage.setItem("rememberedUsername", username);
    } else {
      localStorage.removeItem("rememberedUsername");
    }

    try {
      const res = await signIn("credentials", {
        username,
        password,
        redirect: false
      });
      if (res?.error) {
        setLoginError(res.error);
      } else {
        const redirectParam = searchParams.get("redirect") || "/";
        window.location.href = redirectParam;
      }
    } catch (err) {
      setLoginError("Failed to connect to authentication server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (user: string) => {
    setIsSubmitting(true);
    setLoginError(null);
    try {
      const res = await signIn("credentials", {
        username: user,
        password: "password123",
        redirect: false
      });
      if (res?.error) {
        setLoginError(res.error);
      } else {
        const redirectParam = searchParams.get("redirect");
        if (redirectParam) {
          window.location.href = redirectParam;
        } else {
          // If no redirect param, redirect based on user type
          if (user === "devroot") {
            window.location.href = "/admin";
          } else if (user === "super_admin_market") {
            window.location.href = "/admin";
          } else if (user === "product_admin_market") {
            window.location.href = "/admin/product-admin";
          } else if (user === "user_market") {
            window.location.href = "/admin/user";
          } else {
            window.location.href = "/";
          }
        }
      }
    } catch (err) {
      setLoginError("Failed to connect to authentication server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-955">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Verifying Account Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />

      {/* Main card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        
        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-emerald-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-500/25 mx-auto">
            S
          </div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-transparent">
            Secure Market Portal
          </h1>
          <p className="text-xs text-slate-500 font-medium">Enter your credentials to access your SaaS dashboard</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Username or Email</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. devroot"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all"
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me & forgot password */}
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-800 text-indigo-650 focus:ring-indigo-650 focus:ring-offset-background bg-slate-50"
              />
              Remember Me
            </label>
            <span className="text-indigo-650 hover:underline cursor-not-allowed" title="Future feature implementation">
              Forgot Password?
            </span>
          </div>

          {loginError && (
            <div className="bg-rose-50 border border-rose-100 text-rose-650 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400 p-3.5 rounded-2xl text-[11px] font-bold text-center">
              {loginError === "ACCOUNT_LOCKED" 
                ? "Account locked due to excessive failed attempts." 
                : loginError === "CONCURRENT_SESSION_ACTIVE"
                ? "Concurrent session active. Terminating other sessions or blocked."
                : "Invalid credentials. Please verify details."}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-slate-900 hover:bg-slate-850 dark:bg-indigo-650 dark:hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
          <span className="flex-shrink mx-3 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">SaaS Roles Sandbox</span>
          <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
        </div>

        {/* Demo Quick Logins */}
        <div className="grid grid-cols-2 gap-2 text-[10px] font-extrabold text-slate-655 dark:text-slate-400">
          <button
            onClick={() => handleQuickLogin("devroot")}
            disabled={isSubmitting}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-xl border dark:border-slate-800 text-left transition-all hover:scale-102 flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Developer Sandbox</span>
          </button>
          
          <button
            onClick={() => handleQuickLogin("super_admin_market")}
            disabled={isSubmitting}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-xl border dark:border-slate-800 text-left transition-all hover:scale-102 flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Super Admin</span>
          </button>
          
          <button
            onClick={() => handleQuickLogin("product_admin_market")}
            disabled={isSubmitting}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-xl border dark:border-slate-800 text-left transition-all hover:scale-102 flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Product Admin</span>
          </button>
          
          <button
            onClick={() => handleQuickLogin("user_market")}
            disabled={isSubmitting}
            className="col-span-2 p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-xl border dark:border-slate-800 text-center transition-all hover:scale-101 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>User (Shop Merchant)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
