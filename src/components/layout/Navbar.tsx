"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Menu, Search, User, Sun, Moon, LogOut, LayoutDashboard, Settings, UserCheck, Heart, MapPin, CreditCard, Award, HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/store";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  const items = useCartStore((state) => state.items);
  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const { data: session } = useSession();

  // Hydration fix for Zustand with persist middleware
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check initial theme class
    if (typeof window !== "undefined") {
      setIsDarkTheme(document.documentElement.classList.contains("dark"));
    }

    const handleScroll = () => {
       if (window.scrollY > 20) {
          setIsScrolled(true);
       } else {
          setIsScrolled(false);
       }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDarkTheme;
    setIsDarkTheme(nextDark);
    localStorage.setItem("theme", nextDark ? "dark" : "light");
    if (nextDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLogout = async () => {
    setIsProfileDropdownOpen(false);
    await signOut({ redirect: false });
    window.location.href = "/";
  };

  const CATEGORIES = ["Fresh Vegetables", "Leafy Vegetables", "Groceries", "Fruits"];

  const renderRoleMenuItems = (role: string) => {
    const linkClass = "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold hover:bg-muted transition-colors text-foreground";

    if (role === "DEVELOPER") {
      return (
        <>
          <Link href="/admin" onClick={() => setIsProfileDropdownOpen(false)} className={linkClass}>
            <LayoutDashboard className="w-3.5 h-3.5 text-indigo-500" /> Developer Dashboard
          </Link>
          <Link href="/profile" onClick={() => setIsProfileDropdownOpen(false)} className={linkClass}>
            <User className="w-3.5 h-3.5 text-indigo-500" /> My Profile
          </Link>
          <Link href="/admin/monitoring" onClick={() => setIsProfileDropdownOpen(false)} className={linkClass}>
            <Settings className="w-3.5 h-3.5 text-indigo-500" /> System Monitoring
          </Link>
          <Link href="/admin/audit-logs" onClick={() => setIsProfileDropdownOpen(false)} className={linkClass}>
            <Settings className="w-3.5 h-3.5 text-indigo-500" /> Audit Logs
          </Link>
          <Link href="/admin/api-logs" onClick={() => setIsProfileDropdownOpen(false)} className={linkClass}>
            <Settings className="w-3.5 h-3.5 text-indigo-500" /> API Logs
          </Link>
          <Link href="/admin/settings" onClick={() => setIsProfileDropdownOpen(false)} className={linkClass}>
            <Settings className="w-3.5 h-3.5 text-indigo-500" /> Settings
          </Link>
        </>
      );
    }
    
    if (role === "SUPER_ADMIN") {
      return (
        <>
          <Link href="/admin" onClick={() => setIsProfileDropdownOpen(false)} className={linkClass}>
            <LayoutDashboard className="w-3.5 h-3.5 text-emerald-500" /> Admin Dashboard
          </Link>
          <Link href="/profile" onClick={() => setIsProfileDropdownOpen(false)} className={linkClass}>
            <User className="w-3.5 h-3.5 text-emerald-500" /> My Profile
          </Link>
          <Link href="/admin/users" onClick={() => setIsProfileDropdownOpen(false)} className={linkClass}>
            <User className="w-3.5 h-3.5 text-emerald-500" /> Users (Admins)
          </Link>
          <Link href="/admin/customers" onClick={() => setIsProfileDropdownOpen(false)} className={linkClass}>
            <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Customers
          </Link>
          <Link href="/admin/products" onClick={() => setIsProfileDropdownOpen(false)} className={linkClass}>
            <Settings className="w-3.5 h-3.5 text-emerald-500" /> Products
          </Link>
          <Link href="/admin/reports" onClick={() => setIsProfileDropdownOpen(false)} className={linkClass}>
            <Settings className="w-3.5 h-3.5 text-emerald-500" /> Reports
          </Link>
          <Link href="/admin/settings" onClick={() => setIsProfileDropdownOpen(false)} className={linkClass}>
            <Settings className="w-3.5 h-3.5 text-emerald-500" /> Settings
          </Link>
        </>
      );
    }
    
    if (role === "PRODUCT_ADMIN") {
      return (
        <>
          <Link href="/admin/product-admin" onClick={() => setIsProfileDropdownOpen(false)} className={linkClass}>
            <LayoutDashboard className="w-3.5 h-3.5 text-blue-500" /> Product Admin Dashboard
          </Link>
          <Link href="/admin/product-admin?tab=applications" onClick={() => setIsProfileDropdownOpen(false)} className={linkClass}>
            <Settings className="w-3.5 h-3.5 text-blue-500" /> Applications
          </Link>
          <Link href="/admin/product-admin?tab=shops" onClick={() => setIsProfileDropdownOpen(false)} className={linkClass}>
            <Settings className="w-3.5 h-3.5 text-blue-500" /> Shops
          </Link>
          <Link href="/admin/product-admin?tab=categories" onClick={() => setIsProfileDropdownOpen(false)} className={linkClass}>
            <Settings className="w-3.5 h-3.5 text-blue-500" /> Categories
          </Link>
          <Link href="/admin/product-admin?tab=products" onClick={() => setIsProfileDropdownOpen(false)} className={linkClass}>
            <Settings className="w-3.5 h-3.5 text-blue-500" /> Products Catalog
          </Link>
          <Link href="/admin/product-admin?tab=merchants" onClick={() => setIsProfileDropdownOpen(false)} className={linkClass}>
            <User className="w-3.5 h-3.5 text-blue-500" /> Merchant Accounts
          </Link>
        </>
      );
    }
    
    if (role === "USER") {
      return (
        <>
          <Link href="/admin/user" onClick={() => setIsProfileDropdownOpen(false)} className={linkClass}>
            <LayoutDashboard className="w-3.5 h-3.5 text-amber-500" /> Merchant Dashboard
          </Link>
          <Link href="/admin/user?tab=inventory" onClick={() => setIsProfileDropdownOpen(false)} className={linkClass}>
            <Settings className="w-3.5 h-3.5 text-amber-500" /> Store Inventory
          </Link>
          <Link href="/admin/user?tab=orders" onClick={() => setIsProfileDropdownOpen(false)} className={linkClass}>
            <Settings className="w-3.5 h-3.5 text-amber-500" /> Orders Assigned
          </Link>
        </>
      );
    }
    
    // CUSTOMER role
    return (
      <>
        <Link href="/profile" onClick={() => setIsProfileDropdownOpen(false)} className={linkClass}>
          <User className="w-3.5 h-3.5 text-primary" /> My Profile
        </Link>
        <Link href="/profile?section=orders" onClick={() => setIsProfileDropdownOpen(false)} className={linkClass}>
          <ShoppingCart className="w-3.5 h-3.5 text-primary" /> My Orders
        </Link>
        <Link href="/profile?section=addresses" onClick={() => setIsProfileDropdownOpen(false)} className={linkClass}>
          <MapPin className="w-3.5 h-3.5 text-primary" /> Delivery Addresses
        </Link>
        <Link href="/profile?section=wishlist" onClick={() => setIsProfileDropdownOpen(false)} className={linkClass}>
          <Heart className="w-3.5 h-3.5 text-primary" /> Wishlist
        </Link>
        <Link href="/profile?section=payments" onClick={() => setIsProfileDropdownOpen(false)} className={linkClass}>
          <CreditCard className="w-3.5 h-3.5 text-primary" /> Saved Payments
        </Link>
        <Link href="/profile?section=membership" onClick={() => setIsProfileDropdownOpen(false)} className={linkClass}>
          <Award className="w-3.5 h-3.5 text-primary" /> Premium Membership
        </Link>
        <Link href="/profile?section=support" onClick={() => setIsProfileDropdownOpen(false)} className={linkClass}>
          <HelpCircle className="w-3.5 h-3.5 text-primary" /> Customer Support
        </Link>
      </>
    );
  };

  return (
    <>
      <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${isScrolled ? 'glass-effect border-b py-2' : 'bg-transparent py-4'}`}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 -ml-2 text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
              aria-label="Toggle Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white font-bold text-xl group-hover:scale-110 transition-transform">
                S
              </div>
              <span className="font-bold text-xl hidden sm:block tracking-tight bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-transparent">Secure Market</span>
            </Link>
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="search" 
              placeholder="Search for groceries..." 
              className="w-full bg-muted/50 border-0 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-foreground/80 hover:text-foreground transition-colors md:hidden cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
              aria-label="Toggle Theme"
            >
              {isDarkTheme ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Profile Dropdown */}
            {!session || !session.user ? (
              <Link href="/login" className="p-2 text-foreground/80 hover:text-foreground transition-colors flex items-center gap-2">
                <User className="w-5 h-5" />
                <span className="hidden sm:block text-sm font-medium">Log In</span>
              </Link>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="p-2 text-foreground/80 hover:text-foreground transition-colors flex items-center gap-2 focus:outline-none cursor-pointer"
                >
                  {session.user.image ? (
                     <div className="w-6 h-6 rounded-full overflow-hidden relative border border-primary/20">
                       <Image src={session.user.image} alt={session.user.name || "User"} fill className="object-cover" />
                     </div>
                  ) : (
                     <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                       {session.user.name ? session.user.name[0].toUpperCase() : 'U'}
                     </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium">
                    {session.user.name ? session.user.name.split(' ')[0] : 'Account'}
                  </span>
                </button>

                {isProfileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsProfileDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-card border rounded-2xl shadow-xl py-2 z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-2 border-b">
                        <p className="text-xs font-bold text-foreground truncate">{session.user.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{session.user.email}</p>
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[8px] font-black uppercase tracking-wider">
                          {session.user.role}
                        </span>
                      </div>
                      
                      <div className="py-1 max-h-[300px] overflow-y-auto">
                        {renderRoleMenuItems(session.user.role)}
                        <button 
                          onClick={handleLogout} 
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold hover:bg-red-50 hover:text-red-650 transition-colors text-red-650 border-t mt-1 text-left cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Log Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <Link href="/cart" className="p-2 text-foreground/80 hover:text-foreground transition-colors relative">
              <ShoppingCart className="w-5 h-5" />
              {mounted && cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center rounded-full border-2 border-background">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <div className="md:hidden px-4 pb-4 animate-in slide-in-from-top duration-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="search" 
                autoFocus
                placeholder="Search for groceries..." 
                className="w-full bg-muted/50 border-0 rounded-full py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground shadow-inner"
              />
            </div>
          </div>
        )}
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute top-0 left-0 w-3/4 h-full bg-card shadow-2xl p-6 animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between mb-8">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                  S
                </div>
                <span className="font-bold text-xl">Secure Market</span>
              </Link>
            </div>
            
            <nav className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Categories</h3>
                <div className="space-y-3">
                  {CATEGORIES.map(category => (
                    <Link 
                      key={category} 
                      href={`/?category=${category}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-lg font-medium hover:text-primary transition-colors"
                    >
                      {category}
                    </Link>
                  ))}
                </div>
              </div>
              
              <div className="pt-6 border-t font-medium space-y-4">
                <Link href="/track" onClick={() => setIsMobileMenuOpen(false)} className="block hover:text-primary">Track Order</Link>
                <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="block hover:text-primary">My History</Link>
                <Link href="/help" onClick={() => setIsMobileMenuOpen(false)} className="block hover:text-primary">Help & Support</Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
