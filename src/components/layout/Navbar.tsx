"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Menu, Search, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/store";
import { useSession } from "next-auth/react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const items = useCartStore((state) => state.items);
  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const { data: session } = useSession();

  // Hydration fix for Zustand with persist middleware
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const CATEGORIES = ["Fresh Vegetables", "Leafy Vegetables", "Groceries", "Fruits"];

  return (
    <>
      <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${isScrolled ? 'glass-effect border-b py-2' : 'bg-transparent py-4'}`}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 -ml-2 text-foreground/80 hover:text-foreground transition-colors"
              aria-label="Toggle Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl group-hover:scale-110 transition-transform">
                S
              </div>
              <span className="font-bold text-xl hidden sm:block tracking-tight text-foreground">Secure Market</span>
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
              className="p-2 text-foreground/80 hover:text-foreground transition-colors md:hidden"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <Link href="/profile" className="p-2 text-foreground/80 hover:text-foreground transition-colors flex items-center gap-2">
              {session?.user?.image ? (
                 <div className="w-6 h-6 rounded-full overflow-hidden relative border border-primary/20">
                   <Image src={session.user.image} alt={session.user.name || "User"} fill className="object-cover" />
                 </div>
              ) : (
                 <User className="w-5 h-5" />
              )}
              <span className="hidden sm:block text-sm font-medium">
                {session?.user?.name ? session.user.name.split(' ')[0] : 'Log In'}
              </span>
            </Link>
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
