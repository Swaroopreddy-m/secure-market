"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Package, Truck, CheckCircle2, ChevronRight, MapPin, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";

const STATUS_STEPS = ["PENDING", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"];
const STEP_ICONS = [Package, Package, Truck, CheckCircle2];
const STEP_LABELS = ["Order Placed", "Packed", "Out for Delivery", "Delivered"];

export default function TrackOrderPage() {
  const { id } = useParams();
  const { status } = useSession();
  
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && id) {
      fetch(`/api/orders/${id}`)
        .then(res => res.json())
        .then(data => {
          setOrder(data);
          const idx = STATUS_STEPS.indexOf(data.status);
          setCurrentStatusIndex(idx === -1 ? 0 : idx);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Order fetch failed", err);
          setIsLoading(false);
        });
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [id, status]);

  useEffect(() => {
    // Simulate real-time progress via polling
    const interval = setInterval(() => {
      setCurrentStatusIndex((prev) => {
        if (prev < STATUS_STEPS.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 4000); // Progress every 4 seconds for simulation

    return () => clearInterval(interval);
  }, []);

  if (isLoading || status === "loading") {
    return <div className="container py-32 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!order) {
    return <div className="container py-32 text-center">Order not found or unauthorized access.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-24 max-w-3xl">
      <div className="bg-card border rounded-3xl p-8 shadow-sm text-center">
         <div className="w-16 h-16 bg-green-100 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
           <CheckCircle2 className="w-8 h-8" />
         </div>
         <h1 className="text-3xl font-bold font-inter tracking-tight mb-2">Order Confirmed!</h1>
         <p className="text-muted-foreground mb-8">Thank you for your purchase. Order ID: <span className="font-mono text-foreground font-medium">#{String(id).slice(0,8).toUpperCase()}</span></p>
         
         <div className="border-t border-b py-12 my-8 relative max-w-xl mx-auto">
            {/* Progress line background */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 rounded-full" />
            
            {/* Active progress line */}
            <motion.div 
              className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${(currentStatusIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />

            <div className="relative flex justify-between">
              {STATUS_STEPS.map((statusStep, index) => {
                const Icon = STEP_ICONS[index];
                const isActive = index <= currentStatusIndex;
                return (
                  <div key={statusStep} className="flex flex-col items-center">
                    <motion.div 
                      initial={false}
                      animate={{
                        backgroundColor: isActive ? "var(--primary)" : "var(--background)",
                        borderColor: isActive ? "var(--primary)" : "var(--border)",
                        color: isActive ? "#ffffff" : "var(--muted-foreground)"
                      }}
                      className="w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-sm relative z-10 transition-colors duration-300"
                    >
                      <Icon className="w-5 h-5" />
                    </motion.div>
                    <span className={`text-xs mt-3 font-semibold transition-colors duration-300 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {STEP_LABELS[index]}
                    </span>
                  </div>
                );
              })}
            </div>
         </div>

         <div className="bg-muted/30 rounded-2xl p-6 text-left flex items-start gap-4 mx-auto max-w-xl">
            <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Delivery Address</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {order.deliveryAddress}<br/>
                {order.deliveryCity}<br/>
                Contact: {order.deliveryPhone}
              </p>
            </div>
         </div>

         <Link href="/" className="inline-flex items-center justify-center mt-8 text-primary font-semibold hover:underline">
           Continue Shopping <ChevronRight className="w-4 h-4 ml-1" />
         </Link>
      </div>
    </div>
  );
}
