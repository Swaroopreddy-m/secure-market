"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/store";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CreditCard, CheckCircle2, Loader2, ArrowLeft, MapPin, Plus } from "lucide-react";
import Link from "next/link";

type Address = {
  id: string;
  street: string;
  city: string;
  phone: string;
};

export default function CheckoutPage() {
  const { items, getCartTotal, clearCart } = useCartStore();
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");

  // Address State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");
  
  // New Address Form State
  const [newStreet, setNewStreet] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const subtotal = getCartTotal();
  const delivery = subtotal > 500 ? 0 : 50;
  const taxes = Math.round(subtotal * 0.05); // 5% tax
  const total = subtotal + delivery + taxes;

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/user/addresses")
        .then(async res => {
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`API Error: ${res.status} ${text}`);
          }
          return res.json();
        })
        .then(data => {
          setAddresses(data);
          if (data.length > 0) {
            setSelectedAddressId(data[0].id);
          }
          setIsLoadingAddresses(false);
        })
        .catch(err => {
          console.error("Failed to load addresses", err);
          setIsLoadingAddresses(false);
        });
    } else if (status === "unauthenticated") {
      setIsLoadingAddresses(false);
    }
  }, [status]);

  if (items.length === 0) {
    return (
      <div className="container mx-auto py-24 text-center">
        <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
        <Link href="/" className="text-primary hover:underline">Go back to shopping</Link>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (!session?.user) {
      router.push("/profile");
      return;
    }

    // Validation
    const isNewAddress = selectedAddressId === "new";
    if (isNewAddress) {
      if (!newStreet.trim() || !newCity.trim() || !newPhone.trim()) {
        alert("Please fill in all delivery details");
        return;
      }
    }

    setIsProcessing(true);

    try {
      let finalStreet = "";
      let finalCity = "";
      let finalPhone = "";

      // Save new address if applicable
      if (isNewAddress) {
        const addrRes = await fetch("/api/user/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ street: newStreet, city: newCity, phone: newPhone })
        });
        if (!addrRes.ok) throw new Error("Failed to save address");
        const savedAddress = await addrRes.json();
        
        finalStreet = savedAddress.street;
        finalCity = savedAddress.city;
        finalPhone = savedAddress.phone;
      } else {
        const selected = addresses.find(a => a.id === selectedAddressId);
        if (!selected) throw new Error("Selected address not found");
        finalStreet = selected.street;
        finalCity = selected.city;
        finalPhone = selected.phone;
      }
      
      // Submit order
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          totalAmount: total,
          paymentMethod,
          deliveryStreet: finalStreet,
          deliveryCity: finalCity,
          deliveryPhone: finalPhone
        }),
      });

      if (!response.ok) {
        throw new Error("Checkout failed");
      }

      const order = await response.json();
      clearCart();
      router.push(`/track/${order.id}`);
    } catch (error) {
      console.error("Error processing checkout", error);
      setIsProcessing(false);
      alert("Failed to process checkout. Please try again.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-16 max-w-5xl">
      <Link href="/cart" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Cart
      </Link>
      
      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-10">
          <div>
            <h1 className="text-3xl font-bold font-inter tracking-tight mb-2">Checkout</h1>
            <p className="text-muted-foreground">Complete your delivery and payment details.</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Delivery Address
            </h2>
            
            {status === "loading" || isLoadingAddresses ? (
              <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : status === "unauthenticated" ? (
              <div className="p-6 bg-muted/30 border rounded-2xl text-center text-sm text-muted-foreground">
                Please log in to manage your addresses.
              </div>
            ) : (
              <div className="space-y-4">
                {addresses.map((addr) => (
                  <label key={addr.id} className={`cursor-pointer block border rounded-2xl p-4 transition-all ${selectedAddressId === addr.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-foreground/20'}`}>
                    <div className="flex items-start gap-3">
                      <input 
                        type="radio" 
                        name="address" 
                        value={addr.id} 
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-foreground">{addr.street}</p>
                        <p className="text-sm text-muted-foreground">{addr.city}</p>
                        <p className="text-sm text-muted-foreground mt-1 text-primary">{addr.phone}</p>
                      </div>
                    </div>
                  </label>
                ))}

                <label className={`cursor-pointer block border rounded-2xl p-4 transition-all ${selectedAddressId === 'new' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-foreground/20'}`}>
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="address" 
                      value="new" 
                      checked={selectedAddressId === 'new'}
                      onChange={() => setSelectedAddressId("new")}
                      className="mt-1"
                    />
                    <span className="font-medium flex items-center gap-2"><Plus className="w-4 h-4" /> Use a new address</span>
                  </div>
                </label>

                {selectedAddressId === "new" && (
                  <div className="pl-8 pt-2 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Street Address</label>
                      <input 
                        type="text" 
                        value={newStreet}
                        onChange={(e) => setNewStreet(e.target.value)}
                        placeholder="Flat / House No / Floor / Building" 
                        className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">City & Area</label>
                        <input 
                          type="text" 
                          value={newCity}
                          onChange={(e) => setNewCity(e.target.value)}
                          placeholder="Mumbai" 
                          className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Mobile Number</label>
                        <input 
                          type="text" 
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          placeholder="+91 9876543210" 
                          className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Payment Method</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'card' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'}`}>
                <input type="radio" value="card" checked={paymentMethod === "card"} onChange={(e) => setPaymentMethod(e.target.value)} className="sr-only" />
                <CreditCard className="w-6 h-6" />
                <span className="text-sm font-medium">Card</span>
              </label>
              <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'upi' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'}`}>
                <input type="radio" value="upi" checked={paymentMethod === "upi"} onChange={(e) => setPaymentMethod(e.target.value)} className="sr-only" />
                <div className="w-6 h-6 bg-slate-200 rounded animate-pulse" /> {/* UPI Logo placeholder */}
                <span className="text-sm font-medium">UPI</span>
              </label>
              <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'}`}>
                <input type="radio" value="cod" checked={paymentMethod === "cod"} onChange={(e) => setPaymentMethod(e.target.value)} className="sr-only" />
                <CheckCircle2 className="w-6 h-6" />
                <span className="text-sm font-medium">Auto COD</span>
              </label>
            </div>
          </div>

          {session?.user ? (
            <button 
              onClick={handleCheckout} 
              disabled={isProcessing || isLoadingAddresses}
              className="w-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 py-4 rounded-full font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : paymentMethod === 'cod' ? 'Place Order (COD)' : `Pay ₹${total}`}
            </button>
          ) : (
            <Link href="/profile" className="flex items-center justify-center w-full bg-primary text-primary-foreground py-4 rounded-full font-bold transition-all shadow-lg">
              Log in to Checkout
            </Link>
          )}
        </div>

        <div className="bg-card border rounded-3xl p-8 shadow-sm h-fit sticky top-24">
          <h2 className="text-xl font-bold mb-6 border-b pb-4">Order Summary</h2>
          <div className="space-y-4 max-h-[300px] overflow-auto hide-scrollbar mb-6">
            {items.map(item => (
              <div key={item.id} className="flex justify-between items-start text-sm">
                <div>
                  <p className="font-semibold text-foreground line-clamp-1 flex-1">{item.name}</p>
                  <p className="text-muted-foreground">Qty: {item.quantity} x ₹{item.price}</p>
                </div>
                <span className="font-medium whitespace-nowrap ml-4">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          
          <div className="border-t pt-4 space-y-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="text-foreground font-medium">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Taxes (5%)</span>
              <span className="text-foreground font-medium">₹{taxes}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery</span>
              <span className="text-foreground font-medium">{delivery === 0 ? 'Free' : `₹${delivery}`}</span>
            </div>
          </div>
          <div className="border-t mt-4 pt-4 flex justify-between items-center text-lg font-bold">
            <span>Total Payable</span>
            <span className="text-2xl text-primary">₹{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
