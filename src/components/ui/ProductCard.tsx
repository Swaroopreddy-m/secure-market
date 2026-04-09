"use client";

import Image from "next/image";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { Product } from "@/lib/mockData";
import { useCartStore } from "@/lib/store";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem, updateQuantity, getItemQuantity } = useCartStore();
  const quantity = getItemQuantity(product.id);

  const handleAdd = () => addItem(product);
  const handleRemove = () => updateQuantity(product.id, quantity - 1);
  const handleIncrement = () => updateQuantity(product.id, quantity + 1);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={product.inStock ? { y: -4 } : {}}
      transition={{ duration: 0.2 }}
      className={`group relative bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col h-full ${!product.inStock ? 'opacity-75' : ''}`}
    >
      {!product.inStock && (
        <div className="absolute top-3 left-3 z-10 bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-sm shadow-sm">
          OUT OF STOCK
        </div>
      )}

      <div className="relative w-full aspect-square bg-muted/30 overflow-hidden">
        <Image 
          src={product.image} 
          alt={product.name}
          fill
          className={`object-cover transition-transform duration-500 group-hover:scale-105 ${!product.inStock ? 'grayscale opacity-40' : ''}`}
          sizes="(max-width: 768px) 50vw, 33vw"
        />
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">{product.category}</div>
        <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">{product.unit}</p>
        
        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="flex flex-col">
            {product.inStock ? (
              <span className="text-lg font-bold text-foreground">₹{product.price}</span>
            ) : (
              <span className="text-sm font-medium text-muted-foreground italic">Temporarily unavailable</span>
            )}
          </div>
          
          {product.inStock && (
            <div className="relative h-9">
              {quantity === 0 ? (
                <button 
                  onClick={handleAdd}
                  className="bg-primary/10 hover:bg-primary hover:text-white text-primary border border-primary/20 rounded-full h-9 px-4 flex items-center gap-2 text-sm font-semibold transition-colors w-full"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add
                </button>
              ) : (
                <div className="flex items-center bg-primary rounded-full h-9 px-1 w-[100px] justify-between shadow-sm text-white">
                  <button onClick={handleRemove} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold w-6 text-center">{quantity}</span>
                  <button onClick={handleIncrement} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
