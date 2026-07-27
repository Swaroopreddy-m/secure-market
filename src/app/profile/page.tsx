"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import { LogOut, Package, User, MapPin, ChevronRight, Clock, Loader2 } from "lucide-react";
import Link from "next/link";

interface AddressItem {
  id: string;
  street: string;
  city: string;
  phone: string;
  isDefault: boolean;
}

interface OrderItem {
  id: string;
  status: string;
  createdAt: string;
  totalAmount: number;
  items: {
    id: string;
    product?: {
      image: string;
      name: string;
    };
  }[];
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Auth form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError(null);
    try {
      const res = await signIn("credentials", {
        username,
        password,
        redirect: false
      });
      if (res?.error) {
        setLoginError(res.error);
      } else {
        window.location.reload();
      }
    } catch (err) {
      setLoginError("Failed to connect to authentication server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsSubmitting(true);
    setLoginError(null);
    try {
      const res = await signIn("credentials", {
        redirect: false
      });
      if (res?.error) {
        setLoginError(res.error);
      } else {
        window.location.reload();
      }
    } catch (err) {
      setLoginError("Failed to connect to authentication server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      // setIsLoading is true by default, no need to set it again synchronously
      // which triggers cascading renders.
      Promise.all([
        fetch("/api/orders").then(res => res.json()),
        fetch("/api/user/addresses").then(res => res.json())
      ]).then(([ordersData, addressesData]) => {
        setOrders(ordersData);
        setAddresses(addressesData);
        setIsLoading(false);
      }).catch(err => {
        console.error("Failed to load profile data", err);
        setIsLoading(false);
      });
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="container mx-auto py-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
          <User className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold font-inter tracking-tight mb-2">Account Login</h1>
        <p className="text-muted-foreground mb-8 text-center text-xs max-w-sm">
          Sign in to Secure Market to track orders, manage products, configure SaaS tenants, or access your profile.
        </p>
        
        <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Username or Email</label>
            <input
              type="text"
              required
              placeholder="e.g. devroot"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-background border border-input rounded-2xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-semibold"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-input rounded-2xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-semibold"
            />
          </div>

          {loginError && (
            <div className="bg-red-50 border border-red-100 text-red-650 p-3 rounded-2xl text-[11px] font-bold text-center">
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
            className="w-full bg-foreground text-background py-2.5 rounded-full font-bold text-xs shadow-md hover:bg-foreground/90 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
          </button>
          
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-muted"></div>
            <span className="flex-shrink mx-3 text-[10px] font-bold text-muted-foreground uppercase">or</span>
            <div className="flex-grow border-t border-muted"></div>
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isSubmitting}
            className="w-full bg-muted text-muted-foreground py-2.5 rounded-full font-bold text-xs hover:bg-muted/80 transition-all flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" /> Try Developer Demo Account
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold font-inter tracking-tight mb-2">My Profile</h1>
            <p className="text-muted-foreground">Manage your orders and account settings.</p>
          </div>
          <button 
            onClick={() => signOut()}
            className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors w-fit border border-red-100"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </header>
        
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="border rounded-3xl p-8 bg-card shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="relative w-28 h-28 rounded-full overflow-hidden mb-6 bg-muted border-4 border-background shadow-lg">
                  {session.user?.image ? (
                    <Image src={session.user.image} alt={session.user.name || "User"} fill className="object-cover" />
                  ) : (
                    <User className="w-14 h-14 m-auto mt-7 text-muted-foreground" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-foreground">{session.user?.name}</h2>
                <p className="text-sm text-muted-foreground mt-1 mb-4">{session.user?.email}</p>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
                  Verified Member
                </div>
              </div>
            </div>

            <div className="border rounded-3xl p-8 bg-card shadow-sm">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> Delivery Addresses
              </h3>
              
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                ) : addresses.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic text-center py-4">No addresses saved yet.</p>
                ) : (
                  addresses.map((addr) => (
                    <div key={addr.id} className="p-3 bg-muted/40 rounded-xl border border-transparent hover:border-primary/20 transition-all">
                      <p className="text-sm font-semibold">{addr.street}</p>
                      <p className="text-xs text-muted-foreground">{addr.city}</p>
                      <p className="text-xs text-primary mt-1">{addr.phone}</p>
                    </div>
                  ))
                )}
                
                <Link href="/checkout" className="block text-center text-xs font-bold text-primary hover:underline pt-2">
                  + Add New Address
                </Link>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2 space-y-8">
            <div className="border rounded-3xl overflow-hidden bg-card shadow-sm">
              <div className="p-6 border-b flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
                  <Package className="w-6 h-6 text-primary" /> Order History
                </h3>
              </div>
              
              <div className="divide-y">
                {isLoading ? (
                  <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary/50" /></div>
                ) : orders.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground bg-muted/20">
                    <p className="text-lg mb-2">You haven&apos;t placed any orders yet.</p>
                    <p className="text-sm mb-6">Explore our fresh products and start shopping!</p>
                    <Link href="/" className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-all">
                      Browse Shop
                    </Link>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="p-6 hover:bg-muted/30 transition-colors group">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <p className="font-bold text-foreground">Order #{order.id.slice(-6).toUpperCase()}</p>
                            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter ${
                              order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-bold text-primary">₹{order.totalAmount}</p>
                            <p className="text-[10px] text-muted-foreground">{order.items.length} items</p>
                          </div>
                          <Link 
                            href={`/track/${order.id}`}
                            className="p-2 rounded-full bg-muted group-hover:bg-primary group-hover:text-white transition-all shadow-sm"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </Link>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {order.items?.slice(0, 4).map((item) => (
                          <div key={item.id} className="relative w-12 h-12 rounded-lg border bg-background overflow-hidden flex-shrink-0">
                            <Image src={item.product?.image || ""} alt={item.product?.name || ""} fill className="object-cover" />
                          </div>
                        ))}
                        {order.items.length > 4 && (
                          <div className="w-12 h-12 rounded-lg border bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                            +{order.items.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="bg-primary rounded-3xl p-8 text-primary-foreground relative overflow-hidden group">
               <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
               <h3 className="text-2xl font-bold mb-2 relative z-10">Premium Support</h3>
               <p className="text-primary-foreground/80 mb-6 max-w-sm relative z-10">Have questions about your order or our products? Our dedicated team is here to help 24/7.</p>
               <Link href="/help" className="inline-block bg-white text-primary px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-all relative z-10">
                 Contact Us
               </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
