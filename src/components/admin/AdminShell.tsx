"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, ShoppingBag, Users, ListOrdered, ArrowLeft, Menu, X,
  Sun, Moon, Bell, Search, Command, Settings, ChevronRight, HelpCircle,
  Building2, ShieldCheck, FileSpreadsheet, Terminal, Database, BarChart3,
  Cpu, Sliders, FileText, History, Activity, AlertTriangle, Monitor,
  Plus, Check, Sparkles, User as UserIcon, Play, LogOut, CheckSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  allowedRoles: string[];
}

const ALL_NAV_ITEMS: NavItem[] = [
  { name: "Developer Dashboard", href: "/admin", icon: LayoutDashboard, allowedRoles: ["DEVELOPER"] },
  { name: "Admin Dashboard", href: "/admin", icon: LayoutDashboard, allowedRoles: ["SUPER_ADMIN", "ADMIN"] },
  { name: "Product Dashboard", href: "/admin/product-admin", icon: LayoutDashboard, allowedRoles: ["PRODUCT_ADMIN"] },
  { name: "Shop Dashboard", href: "/admin/user", icon: LayoutDashboard, allowedRoles: ["USER"] },
  { name: "Products (SaaS)", href: "/admin/products", icon: ShoppingBag, allowedRoles: ["DEVELOPER", "SUPER_ADMIN", "PRODUCT_ADMIN"] },
  { name: "Customers", href: "/admin/customers", icon: Building2, allowedRoles: ["DEVELOPER", "SUPER_ADMIN"] },
  { name: "Organizations", href: "/admin/organizations", icon: ShieldCheck, allowedRoles: ["DEVELOPER"] },
  { name: "Users", href: "/admin/users", icon: Users, allowedRoles: ["DEVELOPER", "SUPER_ADMIN", "ADMIN"] },
  { name: "Roles & Matrix", href: "/admin/roles", icon: ShieldCheck, allowedRoles: ["DEVELOPER"] },
  { name: "Audit Logs", href: "/admin/audit-logs", icon: FileSpreadsheet, allowedRoles: ["DEVELOPER", "SUPER_ADMIN"] },
  { name: "API Logs", href: "/admin/api-logs", icon: Terminal, allowedRoles: ["DEVELOPER"] },
  { name: "Database", href: "/admin/database", icon: Database, allowedRoles: ["DEVELOPER"] },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3, allowedRoles: ["DEVELOPER"] },
  { name: "Deployments", href: "/admin/deployments", icon: Cpu, allowedRoles: ["DEVELOPER"] },
  { name: "Feature Flags", href: "/admin/configurations", icon: Sliders, allowedRoles: ["DEVELOPER"] },
  { name: "Notifications", href: "/admin/notifications", icon: Bell, allowedRoles: ["DEVELOPER", "SUPER_ADMIN"] },
  { name: "Reports", href: "/admin/reports", icon: FileText, allowedRoles: ["DEVELOPER", "SUPER_ADMIN"] },
  { name: "Backups", href: "/admin/backups", icon: History, allowedRoles: ["DEVELOPER"] },
  { name: "Monitoring", href: "/admin/monitoring", icon: Activity, allowedRoles: ["DEVELOPER"] },
  { name: "Settings", href: "/admin/settings", icon: Settings, allowedRoles: ["DEVELOPER", "SUPER_ADMIN"] },
  { name: "Store Products", href: "/admin/store-products", icon: ShoppingBag, allowedRoles: ["ADMIN", "DEVELOPER", "USER"] },
  { name: "Store Orders", href: "/admin/orders", icon: ListOrdered, allowedRoles: ["ADMIN", "DEVELOPER", "USER"] }
];

export default function AdminShell({
  children,
  sessionUser
}: {
  children: React.ReactNode;
  sessionUser: { id: string; name: string | null; email: string | null; image: string | null; role: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Responsive / Layout states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(false);
  
  // Interactive UI states
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Mock notifications state
  const [notifications, setNotifications] = useState([
    { id: "1", title: "Suspicious Login Blocked", desc: "User admin from IP 192.168.1.100 was rejected due to active session policy.", time: "5 mins ago", read: false, type: "security" },
    { id: "2", title: "API Limit Reached", desc: "SaaS Product Payments reached 95% of daily API call quota.", time: "1 hour ago", read: false, type: "warning" },
    { id: "3", title: "Database Backup Completed", desc: "Automatic local snapshot completed successfully.", time: "3 hours ago", read: true, type: "success" }
  ]);

  // Filter items by role
  const allowedNavItems = ALL_NAV_ITEMS.filter(item => item.allowedRoles.includes(sessionUser.role));

  // Initialize Theme and Compact Mode from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDarkMode(isDark);
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");

    const savedCompact = localStorage.getItem("compactMode") === "true";
    setIsCompactMode(savedCompact);
  }, []);

  // Listen to keyboard shortcut for Command Palette (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      if (e.key === "Escape") {
        setIsCommandPaletteOpen(false);
        setIsNotificationOpen(false);
        setIsProfileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleTheme = () => {
    const newDark = !isDarkMode;
    setIsDarkMode(newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
    if (newDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const toggleCompact = () => {
    const newCompact = !isCompactMode;
    setIsCompactMode(newCompact);
    localStorage.setItem("compactMode", String(newCompact));
  };

  // Generate breadcrumbs
  const getBreadcrumbs = () => {
    const paths = pathname.split("/").filter(p => p);
    return paths.map((path, idx) => {
      const href = "/" + paths.slice(0, idx + 1).join("/");
      const name = path.charAt(0).toUpperCase() + path.slice(1).replace("-", " ");
      return { name, href, isLast: idx === paths.length - 1 };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  // Filter command palette options
  const filteredCommands = allowedNavItems.filter(item =>
    item.name.toLowerCase().includes(commandSearch.toLowerCase())
  );

  const handleCommandSelect = (href: string) => {
    setIsCommandPaletteOpen(false);
    setCommandSearch("");
    router.push(href);
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300 ${
      isCompactMode ? "text-xs px-1" : "text-sm"
    }`}>
      
      {/* 1. Sidebar for Desktop/Laptop */}
      <aside 
        className={`fixed left-0 top-0 bottom-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 z-30 flex flex-col ${
          sidebarCollapsed ? "w-20" : "w-64"
        } hidden lg:flex`}
      >
        {/* Sidebar Header */}
        <div className={`p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between`}>
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/30">
              S
            </div>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col"
              >
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-transparent">Secure Market</span>
                <span className="text-[9px] font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
                  {sessionUser.role.replace("_", " ")}
                </span>
              </motion.div>
            )}
          </Link>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 hide-scrollbar">
          {allowedNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all duration-200 group relative ${
                  isActive 
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-105 ${
                  isActive ? "text-white" : "text-slate-500"
                }`} />
                {!sidebarCollapsed && <span>{item.name}</span>}
                {isActive && !sidebarCollapsed && (
                  <motion.div 
                    layoutId="activeIndicator"
                    className="absolute right-2 w-1.5 h-6 bg-white rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold text-xs"
          >
            <Monitor className="w-4 h-4" />
            {!sidebarCollapsed && <span>Toggle Compact View</span>}
          </button>
        </div>
      </aside>

      {/* 2. Drawer Sidebar for Mobile/Tablet */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop Mask */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black z-40 lg:hidden"
            />
            {/* Mobile Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col lg:hidden"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">S</div>
                  <div className="flex flex-col">
                    <span className="font-extrabold text-sm bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-transparent">Secure Market</span>
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">{sessionUser.role.replace("_", " ")}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 hide-scrollbar">
                {allowedNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                        isActive 
                          ? "bg-indigo-500 text-white shadow-lg" 
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <Link
                  href="/"
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Store
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold text-left"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* 3. Main Dashboard Body Wrapper */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${
          sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        } pb-20 lg:pb-0`} // mobile bottom nav buffer
      >
        
        {/* Sticky Header */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 flex items-center justify-between px-6 z-20 transition-all">
          <div className="flex items-center gap-4">
            {/* Hamburger for Mobile/Tablet */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumbs for Tablet/Desktop */}
            <nav className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
              <Link href={sessionUser.role === "PRODUCT_ADMIN" ? "/admin/product-admin" : sessionUser.role === "USER" ? "/admin/user" : "/admin"} className="hover:text-indigo-600 transition-colors">Dashboard</Link>
              {breadcrumbs.map((bc) => (
                <div key={bc.href} className="flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  <Link 
                    href={bc.href} 
                    className={`${bc.isLast ? "text-slate-800 dark:text-slate-100 font-extrabold" : "hover:text-indigo-600 transition-colors"}`}
                  >
                    {bc.name === "Admin" ? "Dashboard" : bc.name}
                  </Link>
                </div>
              ))}
            </nav>
          </div>

          {/* Quick Actions & Profile Area */}
          <div className="flex items-center gap-3">
            {/* Global Search / Command Shortcut */}
            <button 
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden md:flex items-center gap-3 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl text-xs hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-200/50 dark:hover:bg-slate-800/80 transition-all font-medium w-48 lg:w-60"
            >
              <Search className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">Search or type '/'</span>
              <kbd className="bg-white dark:bg-slate-700 border dark:border-slate-600 px-1.5 py-0.5 rounded-lg text-[9px] font-bold text-slate-400 dark:text-slate-300 flex items-center gap-0.5">
                <Command className="w-2.5 h-2.5" /> K
              </kbd>
            </button>
            
            {/* Mobile Search Button */}
            <button 
              onClick={() => setIsCommandPaletteOpen(true)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 md:hidden"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Dark Mode Switcher */}
            <button 
              onClick={toggleTheme}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 transition-all"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>

            {/* Compact Mode Switcher */}
            <button 
              onClick={toggleCompact}
              className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 transition-all hidden sm:block ${
                isCompactMode ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600" : ""
              }`}
              title="Toggle Compact Data density"
            >
              <CheckSquare className="w-5 h-5" />
            </button>

            {/* Notification Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 relative transition-all ${
                  isNotificationOpen ? "bg-slate-100 dark:bg-slate-800" : ""
                }`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse border border-white dark:border-slate-900">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsNotificationOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-40 overflow-hidden"
                    >
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-100">Notifications</span>
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[300px] overflow-y-auto">
                        {notifications.map((n) => (
                          <div key={n.id} className={`p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${!n.read ? "bg-indigo-50/30 dark:bg-indigo-950/10" : ""}`}>
                            <div className="flex gap-2.5">
                              {n.type === "security" ? (
                                <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                              ) : n.type === "warning" ? (
                                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                              ) : (
                                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                              )}
                              <div className="space-y-1">
                                <p className="font-bold text-xs text-slate-800 dark:text-slate-100">{n.title}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">{n.desc}</p>
                                <p className="text-[9px] text-slate-400 dark:text-slate-500">{n.time}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center border border-indigo-200 dark:bg-slate-800 dark:text-indigo-400 dark:border-slate-700">
                  {sessionUser.name?.[0].toUpperCase() || "A"}
                </div>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-40 overflow-hidden"
                    >
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                        <p className="font-bold text-xs text-slate-800 dark:text-slate-100">{sessionUser.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{sessionUser.email}</p>
                        <span className="inline-block mt-2 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 rounded-lg text-[9px] font-black uppercase">
                          {sessionUser.role}
                        </span>
                      </div>
                      <div className="p-2 space-y-0.5">
                        <Link 
                          href="/profile" 
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                        >
                          <UserIcon className="w-4 h-4" /> My Profile
                        </Link>
                        <button
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all text-left"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 flex flex-col justify-between">
          <div className="flex-1">
            {children}
          </div>
          <footer className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-[10px] sm:text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} Secure Market Enterprise Portal. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
              <Link href="/terms" className="hover:underline">Terms of Service</Link>
            </div>
          </footer>
        </main>
      </div>

      {/* 4. Bottom Navigation for Mobile Devices */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-30 flex items-center justify-around lg:hidden shadow-lg">
        {allowedNavItems.slice(0, 4).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-colors ${
                isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[9px] font-bold mt-1 tracking-tight truncate max-w-full">{item.name}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex flex-col items-center justify-center w-12 h-12 text-slate-500"
        >
          <Command className="w-5 h-5" />
          <span className="text-[9px] font-bold mt-1 tracking-tight">Search</span>
        </button>
      </nav>

      {/* 5. Command Palette Modal (Ctrl+K Modal) */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCommandPaletteOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-12 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[450px]"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type a command or search modules..."
                  value={commandSearch}
                  onChange={(e) => setCommandSearch(e.target.value)}
                  autoFocus
                  className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-800 dark:text-slate-100 text-sm font-bold placeholder-slate-400"
                />
                <button 
                  onClick={() => setIsCommandPaletteOpen(false)}
                  className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border rounded-lg text-[10px] font-bold text-slate-500"
                >
                  ESC
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-50 dark:divide-slate-800 hide-scrollbar">
                {filteredCommands.length > 0 ? (
                  filteredCommands.map((cmd) => (
                    <button
                      key={cmd.href}
                      onClick={() => handleCommandSelect(cmd.href)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-all font-bold text-left group"
                    >
                      <cmd.icon className="w-4 h-4 text-slate-500 group-hover:scale-105 transition-transform" />
                      <span>{cmd.name}</span>
                    </button>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-400 dark:text-slate-500">
                    No modules found for "{commandSearch}"
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
