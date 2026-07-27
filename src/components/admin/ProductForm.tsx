"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StoreProduct } from "@prisma/client";
import { CATEGORIES } from "@/lib/mockData";
import { Save, X, Loader2, Upload, AlertCircle } from "lucide-react";
import Image from "next/image";

interface ProductFormProps {
  initialData?: StoreProduct | null;
}

export default function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    price: initialData?.price || 0,
    unit: initialData?.unit || "1 kg",
    category: initialData?.category || CATEGORIES[1],
    image: initialData?.image || "",
    inStock: initialData?.inStock ?? true,
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url = initialData 
        ? `/api/products/${initialData.id}` 
        : "/api/products";
      
      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8 animate-in fade-in duration-500">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="glass-effect p-8 rounded-3xl border border-primary/5 space-y-4">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
               <div className="w-1.5 h-6 bg-primary rounded-full" /> General Information
            </h3>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground ml-1">Product Name</label>
              <input
                required
                type="text"
                placeholder="e.g. Organic Tomatoes"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-background border border-primary/10 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground ml-1">Price (₹)</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="w-full bg-background border border-primary/10 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground ml-1">Unit</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. 1 kg"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full bg-background border border-primary/10 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground ml-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-background border border-primary/10 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium appearance-none"
              >
                {CATEGORIES.filter(c => c !== "All").map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="glass-effect p-8 rounded-3xl border border-primary/5">
             <div className="flex items-center justify-between">
                <div>
                   <h3 className="font-bold text-lg leading-none">Inventory Status</h3>
                   <p className="text-xs text-muted-foreground mt-1">Available for customers to buy</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={formData.inStock}
                    onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                  />
                  <div className="w-14 h-7 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                </label>
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-effect p-8 rounded-3xl border border-primary/5 space-y-4">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
               <div className="w-1.5 h-6 bg-primary rounded-full" /> Product Media
            </h3>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground ml-1">Image URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="flex-1 bg-background border border-primary/10 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-xs font-mono"
                />
              </div>
            </div>

            <div className="aspect-square relative rounded-3xl border-2 border-dashed border-primary/10 overflow-hidden group">
               {formData.image ? (
                 <>
                   <Image 
                     src={formData.image} 
                     alt="Preview" 
                     fill 
                     className="object-cover group-hover:scale-105 transition-transform duration-500" 
                     onError={() => setError("Invalid image URL")}
                   />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <button 
                        type="button" 
                        onClick={() => setFormData({ ...formData, image: "" })}
                        className="bg-red-500 text-white p-2 rounded-full transform scale-0 group-hover:scale-100 transition-transform"
                     >
                       <X className="w-5 h-5" />
                     </button>
                   </div>
                 </>
               ) : (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/60 p-8 text-center bg-muted/20">
                    <Upload className="w-10 h-10 mb-4 opacity-20" />
                    <p className="text-sm font-bold">Image Preview</p>
                    <p className="text-xs">Paste a URL above to see the preview here</p>
                 </div>
               )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold animate-in shake-in duration-300">
               <AlertCircle className="w-5 h-5 flex-shrink-0" />
               {error}
            </div>
          )}

          <div className="flex gap-4">
             <button
               type="button"
               disabled={isLoading}
               onClick={() => router.back()}
               className="flex-1 bg-white border border-primary/10 py-4 rounded-2xl font-bold hover:bg-muted/50 transition-colors flex items-center justify-center gap-2"
             >
               Cancel
             </button>
             <button
               type="submit"
               disabled={isLoading}
               className="flex-[2] bg-primary text-primary-foreground py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
             >
               {isLoading ? (
                 <>
                   <Loader2 className="w-5 h-5 animate-spin" /> Saving...
                 </>
               ) : (
                 <>
                   <Save className="w-5 h-5" /> {initialData ? "Update Product" : "Create Product"}
                 </>
               )}
             </button>
          </div>
        </div>
      </div>
    </form>
  );
}
