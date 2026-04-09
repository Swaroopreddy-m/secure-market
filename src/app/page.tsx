"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { CATEGORIES } from "@/lib/mockData";
import { Product } from "@prisma/client";
import ProductCard from "@/components/ui/ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Truck, ShieldCheck, Clock, Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCategory = searchParams.get("category") || CATEGORIES[0];
  const [activeCategory, setActiveCategory] = useState(initialCategory === "All" ? CATEGORIES[0] : initialCategory);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    router.push(`/?category=${category}`, { scroll: false });
  };

  useEffect(() => {
    const categoryFromURL = searchParams.get("category");
    if (categoryFromURL) {
      setActiveCategory(categoryFromURL);
    }
  }, [searchParams]);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/products?category=${activeCategory}`)
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [activeCategory]);

  const scrollToProducts = () => {
    const element = document.getElementById('products');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 -z-10" />
        {/* Abstract shapes for background */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl -z-10" />
        
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 max-w-xl"
          >
            <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary font-semibold text-sm border border-primary/20">
              Fresh & Fast Delivery
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-inter tracking-tight text-foreground leading-[1.1]">
              Groceries delivered <br />
              <span className="text-primary italic">fresh</span> to your door.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Shop from our vast collection of fresh vegetables, fruits, and daily groceries. 
              Quality guaranteed, secure payments, and fast delivery.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={scrollToProducts}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/25"
              >
                Shop Now <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="pt-8 flex items-center gap-8 text-sm font-medium text-muted-foreground">
               <div className="flex items-center gap-2">
                 <Truck className="w-5 h-5 text-primary" /> Free Delivery
               </div>
               <div className="flex items-center gap-2">
                 <ShieldCheck className="w-5 h-5 text-primary" /> Secure Payment
               </div>
               <div className="flex items-center gap-2">
                 <Clock className="w-5 h-5 text-primary" /> 30 Min Delivery
               </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative hidden md:block aspect-[4/3] w-full"
          >
             <div className="absolute inset-4 rounded-3xl overflow-hidden shadow-2xl">
               <Image 
                 src="https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                 alt="Fresh Groceries" 
                 fill 
                 sizes="(max-width: 768px) 100vw, 50vw"
                 className="object-cover"
                 priority
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
             </div>
             
             {/* Floating badge */}
             <motion.div 
               animate={{ y: [0, -10, 0] }}
               transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
               className="absolute -left-6 bottom-12 glass-effect p-4 rounded-2xl flex items-center gap-4"
             >
               <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">🥬</div>
               <div>
                 <p className="text-sm font-bold text-foreground">100% Organic</p>
                 <p className="text-xs text-muted-foreground">Certified Farms</p>
               </div>
             </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Category Navigation & Products */}
      <section id="products" className="py-16 container mx-auto px-4 scroll-mt-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h2 className="text-2xl md:text-3xl font-bold font-inter tracking-tight">Browse Categories</h2>
          
          <div className="flex overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0 gap-2">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  activeCategory === category 
                  ? "bg-foreground text-background shadow-md" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <motion.div 
          layout
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 min-h-[300px]"
        >
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <AnimatePresence mode="popLayout">
                {products.map(product => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {products.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  <p>No products found in this category.</p>
                </div>
              )}
            </>
          )}
        </motion.div>
      </section>
      
      {/* Banner Section */}
      <section className="container mx-auto px-4 py-12 mb-16">
        <div className="bg-primary rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between text-primary-foreground relative overflow-hidden">
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/food.png')] mix-blend-overlay"></div>
          
          <div className="relative z-10 max-w-lg mb-8 md:mb-0">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Get 20% Off Your First Order!</h2>
            <p className="text-primary-foreground/80 mb-6">Sign up today and use code FRESH20 at checkout to claim your discount on all fresh produce.</p>
            <button className="bg-white text-primary px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-shadow">
              Claim Offer
            </button>
          </div>
          
          <div className="relative z-10 hidden md:flex items-center justify-center bg-white/20 p-8 rounded-full backdrop-blur-sm border border-white/30">
             <div className="text-5xl font-black italic tracking-tighter">FRESH20</div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>}>
      <HomeContent />
    </Suspense>
  )
}
