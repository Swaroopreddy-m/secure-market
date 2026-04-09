"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/store";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getCartTotal } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const subtotal = getCartTotal();
  const delivery = subtotal > 500 ? 0 : 50;
  const taxes = Math.round(subtotal * 0.05); // 5% tax
  const total = subtotal + delivery + taxes;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center min-h-[60vh]">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold font-inter tracking-tight mb-4">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-8 max-w-md">Looks like you haven't added anything to your cart yet. Browse our categories and discover fresh deals!</p>
        <Link href="/" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-full font-bold transition-all shadow-md">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <h1 className="text-3xl md:text-4xl font-bold font-inter tracking-tight mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="hidden sm:grid grid-cols-6 gap-4 p-4 bg-muted/50 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-3">Product</div>
              <div className="col-span-1 text-center">Quantity</div>
              <div className="col-span-1 text-right">Price</div>
              <div className="col-span-1 text-right">Total</div>
            </div>

            {/* Items */}
            <div className="divide-y">
              {items.map((item) => (
                <div key={item.id} className="grid sm:grid-cols-6 gap-4 p-4 sm:items-center">
                  <div className="col-span-3 flex items-center gap-4">
                    <div className="relative w-20 h-20 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground line-clamp-1">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.unit}</p>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 text-sm flex items-center gap-1 mt-1 hover:underline sm:hidden"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>

                  <div className="col-span-1 flex items-center sm:justify-center mt-4 sm:mt-0">
                    <div className="flex items-center bg-muted rounded-full">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-black/10 rounded-full transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-black/10 rounded-full transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="col-span-1 text-right hidden sm:block">
                     <span className="font-medium text-muted-foreground">₹{item.price}</span>
                  </div>

                  <div className="col-span-1 flex items-center justify-between sm:justify-end mt-4 sm:mt-0">
                    <span className="font-bold">₹{item.price * item.quantity}</span>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 p-2 hover:bg-red-50 rounded-full hidden sm:block transition-colors ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1 bg-card border rounded-2xl p-6 shadow-sm sticky top-24">
          <h2 className="text-xl font-bold mb-6">Order Summary</h2>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal ({items.length} items)</span>
              <span className="text-foreground font-medium">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Taxes (5%)</span>
              <span className="text-foreground font-medium">₹{taxes}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery Charges</span>
              <span className="text-foreground font-medium">
                {delivery === 0 ? <span className="text-primary">Free</span> : `₹${delivery}`}
              </span>
            </div>
          </div>
          
          <div className="border-t my-6 pt-6">
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-bold">Total Amount</span>
              <span className="text-2xl font-black text-primary">₹{total}</span>
            </div>
            
            <Link href="/checkout" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md">
              Proceed to Checkout <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="mt-4 text-xs text-center text-muted-foreground">
            <p>Secure checkout powered by Stripe. 100% money back guarantee on quality issues.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
