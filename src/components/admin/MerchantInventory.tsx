"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ShoppingBag, Plus, Loader2, CheckCircle, 
  AlertCircle, Trash2, Edit2, ToggleLeft, ToggleRight,
  TrendingUp, IndianRupee, Eye, EyeOff, Save, X, Image as ImageIcon
} from "lucide-react";
import { getProductPlaceholder } from "@/lib/mockData";


interface StoreProduct {
  id: string;
  name: string;
  price: number;
  unit: string;
  category: string;
  image: string;
  inStock: boolean;
  discount: number;
  quality: string;
  description: string | null;
  stock: number;
  images: string; // JSON string of images array
}

interface MerchantInventoryProps {
  initialProducts: StoreProduct[];
}

export default function MerchantInventory({
  initialProducts
}: MerchantInventoryProps) {
  const router = useRouter();
  const [products, setProducts] = useState<StoreProduct[]>(initialProducts);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add Form state
  const [form, setForm] = useState({
    name: "",
    price: "",
    unit: "1 kg",
    category: "Fresh Vegetables",
    image: "/images/products/vegetables.jpg",
    inStock: true,
    discount: "0",
    quality: "Premium",
    description: "",
    stock: "100",
    galleryInput: "" // Comma-separated gallery images
  });

  // Edit Form state
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    unit: "",
    category: "",
    image: "",
    inStock: true,
    discount: "0",
    quality: "Premium",
    description: "",
    stock: "100",
    galleryInput: ""
  });

  // File Upload Handlers with Compression and Resize
  const processImageFile = (file: File, isEdit: boolean) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7); // 70% quality
        if (isEdit) {
          setEditForm(prev => ({ ...prev, image: compressedBase64 }));
        } else {
          setForm(prev => ({ ...prev, image: compressedBase64 }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file, isEdit);
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>, isEdit: boolean) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file, isEdit);
  };

  const handleGalleryFilesChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6); // 60% quality
          
          if (isEdit) {
            setEditForm(prev => {
              const currentList = prev.galleryInput ? prev.galleryInput.split(",").map(i => i.trim()).filter(Boolean) : [];
              return { ...prev, galleryInput: [...currentList, compressedBase64].join(",") };
            });
          } else {
            setForm(prev => {
              const currentList = prev.galleryInput ? prev.galleryInput.split(",").map(i => i.trim()).filter(Boolean) : [];
              return { ...prev, galleryInput: [...currentList, compressedBase64].join(",") };
            });
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const removeGalleryImage = (index: number, isEdit: boolean) => {
    if (isEdit) {
      setEditForm(prev => {
        const currentList = prev.galleryInput ? prev.galleryInput.split(",").map(i => i.trim()).filter(Boolean) : [];
        const updated = currentList.filter((_, i) => i !== index);
        return { ...prev, galleryInput: updated.join(",") };
      });
    } else {
      setForm(prev => {
        const currentList = prev.galleryInput ? prev.galleryInput.split(",").map(i => i.trim()).filter(Boolean) : [];
        const updated = currentList.filter((_, i) => i !== index);
        return { ...prev, galleryInput: updated.join(",") };
      });
    }
  };

  // Handle Create Product
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const priceNum = parseFloat(form.price);
    const discountNum = parseFloat(form.discount || "0");
    const stockNum = parseInt(form.stock || "100", 10);

    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Please enter a valid price greater than 0");
      setIsLoading(false);
      return;
    }

    const galleryImages = form.galleryInput
      ? form.galleryInput.split(",").map(i => i.trim()).filter(Boolean)
      : [];

    try {
      const res = await fetch("/api/merchant-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          price: priceNum,
          unit: form.unit,
          category: form.category,
          image: form.image,
          inStock: form.inStock,
          discount: discountNum,
          quality: form.quality,
          description: form.description,
          stock: stockNum,
          images: galleryImages
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add store product");
      }

      const newProd = await res.json();
      setProducts(prev => [newProd, ...prev]);
      setSuccess(`Successfully added item "${form.name}" to store inventory!`);
      
      setForm({
        name: "",
        price: "",
        unit: "1 kg",
        category: "Fresh Vegetables",
        image: "/images/products/vegetables.jpg",
        inStock: true,
        discount: "0",
        quality: "Premium",
        description: "",
        stock: "100",
        galleryInput: ""
      });
      setIsAdding(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Start Edit Mode
  const startEdit = (prod: StoreProduct) => {
    let parsedGallery: string[] = [];
    try {
      if (prod.images) {
        parsedGallery = JSON.parse(prod.images);
      }
    } catch (e) {
      parsedGallery = [];
    }

    setEditingId(prod.id);
    setEditForm({
      name: prod.name,
      price: prod.price.toString(),
      unit: prod.unit,
      category: prod.category,
      image: prod.image,
      inStock: prod.inStock,
      discount: prod.discount.toString(),
      quality: prod.quality,
      description: prod.description || "",
      stock: prod.stock.toString(),
      galleryInput: parsedGallery.join(", ")
    });
    setIsAdding(false);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const priceNum = parseFloat(editForm.price);
    const discountNum = parseFloat(editForm.discount || "0");
    const stockNum = parseInt(editForm.stock || "100", 10);

    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Please enter a valid price greater than 0");
      setIsLoading(false);
      return;
    }

    const galleryImages = editForm.galleryInput
      ? editForm.galleryInput.split(",").map(i => i.trim()).filter(Boolean)
      : [];

    try {
      const res = await fetch(`/api/merchant-products/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          price: priceNum,
          unit: editForm.unit,
          category: editForm.category,
          image: editForm.image,
          inStock: editForm.inStock,
          discount: discountNum,
          quality: editForm.quality,
          description: editForm.description,
          stock: stockNum,
          images: galleryImages
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update store product");
      }

      const updated = await res.json();
      setProducts(prev => prev.map(p => p.id === editingId ? updated : p));
      setSuccess(`Successfully updated product "${editForm.name}"!`);
      setEditingId(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle inStock availability status
  const handleToggleStock = async (id: string, currentStatus: boolean) => {
    setError(null);
    setSuccess(null);
    
    try {
      const res = await fetch(`/api/merchant-products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inStock: !currentStatus })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update item availability");
      }

      const updated = await res.json();
      setProducts(prev => prev.map(p => p.id === id ? { ...p, inStock: updated.inStock } : p));
      setSuccess(`Updated stock status for "${updated.name}"!`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from store inventory?`)) return;
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/merchant-products/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete store product");
      }

      setProducts(prev => prev.filter(p => p.id !== id));
      setSuccess(`Deleted item "${name}" from store inventory!`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 dark:bg-rose-955/20 dark:border-rose-900/30 text-rose-650 dark:text-rose-400 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 dark:bg-emerald-955/20 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Header controls */}
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-indigo-500" /> Managed Store Inventory
        </h3>
        <button
          onClick={() => {
            setEditingId(null);
            setIsAdding(!isAdding);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-indigo-650/10"
        >
          {isAdding ? "Cancel Form" : <><Plus className="w-4 h-4" /> Add Product Offering</>}
        </button>
      </div>

      {/* Product Creator Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 p-6 rounded-3xl space-y-4 animate-in fade-in duration-300 shadow-sm max-w-3xl">
          <h4 className="font-extrabold text-xs text-indigo-650 flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add Grocery Product to Catalog</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Product Name</label>
              <input
                required
                type="text"
                placeholder="Organic Strawberries"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
              >
                <option value="Fresh Vegetables">Fresh Vegetables</option>
                <option value="Leafy Vegetables">Leafy Vegetables</option>
                <option value="Groceries">Groceries</option>
                <option value="Fruits">Fresh Fruits</option>
                <option value="Electronics">Electronics</option>
                <option value="Fashion">Fashion & Apparel</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quality / Grade</label>
              <select
                value={form.quality}
                onChange={(e) => setForm({ ...form, quality: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
              >
                <option value="Premium">Premium Quality</option>
                <option value="Regular">Regular Grade</option>
                <option value="A+ Standard">A+ Standard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Price (INR ₹)</label>
              <input
                required
                type="number"
                step="0.01"
                placeholder="150.00"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-955 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Discount (%)</label>
              <input
                type="number"
                placeholder="10"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-955 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Unit / Pack size</label>
              <input
                required
                type="text"
                placeholder="1 kg, 500 g, 1 pack"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">In-Stock Quantity</label>
              <input
                required
                type="number"
                placeholder="100"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-955 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
              <textarea
                rows={2}
                placeholder="Organic farm strawberries rich in vitamins..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold resize-none"
              />
            </div>

            <div className="space-y-1 flex flex-col justify-between">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Availability Check</label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-700 dark:text-slate-350 mt-2">
                  <input
                    type="checkbox"
                    checked={form.inStock}
                    onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
                    className="rounded text-indigo-650"
                  />
                  Enable Store Product Listing
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t dark:border-slate-800 pt-4">
            <h5 className="text-xs font-extrabold text-slate-700 dark:text-slate-350 uppercase tracking-wide">Product Media & Gallery</h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primary Image Uploader */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Primary Product Image</label>
                
                {form.image ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video bg-slate-50 dark:bg-slate-900 group">
                    <img src={form.image} alt="Primary preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        type="button" 
                        onClick={() => setForm(prev => ({ ...prev, image: "" }))}
                        className="p-2 bg-red-650 hover:bg-red-700 text-white rounded-full transition-transform active:scale-90"
                        title="Delete Image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleImageDrop(e, false)}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-indigo-500 rounded-2xl p-6 text-center bg-slate-50/50 dark:bg-slate-950/20 transition-colors flex flex-col items-center justify-center cursor-pointer min-h-[140px]"
                    onClick={() => document.getElementById("create-primary-file")?.click()}
                  >
                    <input 
                      type="file" 
                      id="create-primary-file" 
                      accept="image/*" 
                      onChange={(e) => handleImageFileChange(e, false)} 
                      className="hidden" 
                    />
                    <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Drag & drop photo or click to upload</p>
                    <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, WebP up to 5MB (compressed automatically)</p>
                  </div>
                )}
                
                <input 
                  type="text" 
                  placeholder="Or paste an image URL here..." 
                  value={form.image}
                  onChange={(e) => setForm(prev => ({ ...prev, image: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-955 border rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono font-semibold"
                />
              </div>

              {/* Gallery Images Uploader */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Gallery Images (Multiple)</label>
                
                <div className="grid grid-cols-4 gap-2">
                  {(form.galleryInput ? form.galleryInput.split(",").map(i => i.trim()).filter(Boolean) : []).map((imgUrl, idx) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden border aspect-square bg-slate-50 group">
                      <img src={imgUrl} alt={`Gallery preview ${idx}`} className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => removeGalleryImage(idx, false)}
                        className="absolute top-1 right-1 p-1 bg-red-650 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                  
                  <div 
                    onClick={() => document.getElementById("create-gallery-file")?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-indigo-500 rounded-lg flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-955/20 cursor-pointer aspect-square"
                  >
                    <input 
                      type="file" 
                      id="create-gallery-file" 
                      accept="image/*" 
                      multiple 
                      onChange={(e) => handleGalleryFilesChange(e, false)} 
                      className="hidden" 
                    />
                    <Plus className="w-4 h-4 text-slate-400" />
                    <span className="text-[8px] font-bold text-slate-400 mt-1">Add Photos</span>
                  </div>
                </div>
                
                <input 
                  type="text" 
                  placeholder="Or paste comma separated image URLs..." 
                  value={form.galleryInput}
                  onChange={(e) => setForm(prev => ({ ...prev, galleryInput: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-955 border rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono font-semibold"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-650 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Store Product"}
          </button>
        </form>
      )}

      {/* Edit Product Form */}
      {editingId && (
        <form onSubmit={handleEditSubmit} className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-950 p-6 rounded-3xl space-y-4 animate-in fade-in duration-300 shadow-sm max-w-3xl">
          <div className="flex items-center justify-between border-b dark:border-slate-800 pb-2">
            <h4 className="font-extrabold text-xs text-amber-650 flex items-center gap-1.5"><Edit2 className="w-4 h-4" /> Edit Catalog Product: {editForm.name}</h4>
            <button 
              type="button" 
              onClick={() => setEditingId(null)}
              className="text-slate-400 hover:text-slate-650"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Product Name</label>
              <input
                required
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
              <select
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
              >
                <option value="Fresh Vegetables">Fresh Vegetables</option>
                <option value="Leafy Vegetables">Leafy Vegetables</option>
                <option value="Groceries">Groceries</option>
                <option value="Fruits">Fresh Fruits</option>
                <option value="Electronics">Electronics</option>
                <option value="Fashion">Fashion & Apparel</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quality</label>
              <select
                value={editForm.quality}
                onChange={(e) => setEditForm({ ...editForm, quality: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-955 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
              >
                <option value="Premium">Premium Quality</option>
                <option value="Regular">Regular Grade</option>
                <option value="A+ Standard">A+ Standard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Price (INR ₹)</label>
              <input
                required
                type="number"
                step="0.01"
                value={editForm.price}
                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-955 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Discount (%)</label>
              <input
                type="number"
                value={editForm.discount}
                onChange={(e) => setEditForm({ ...editForm, discount: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-955 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Unit</label>
              <input
                required
                type="text"
                value={editForm.unit}
                onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stock Qty</label>
              <input
                required
                type="number"
                value={editForm.stock}
                onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-955 border rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
              <textarea
                rows={2}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-955 border rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold resize-none"
              />
            </div>

            <div className="space-y-1 flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-700 dark:text-slate-350 mb-3">
                <input
                  type="checkbox"
                  checked={editForm.inStock}
                  onChange={(e) => setEditForm({ ...editForm, inStock: e.target.checked })}
                  className="rounded text-indigo-650"
                />
                Product is active and in stock
              </label>
            </div>
          </div>

          <div className="space-y-4 border-t dark:border-slate-800 pt-4">
            <h5 className="text-xs font-extrabold text-slate-700 dark:text-slate-350 uppercase tracking-wide">Product Media & Gallery</h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primary Image Uploader */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Primary Product Image</label>
                
                {editForm.image ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video bg-slate-50 dark:bg-slate-900 group">
                    <img src={editForm.image} alt="Primary preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        type="button" 
                        onClick={() => setEditForm(prev => ({ ...prev, image: "" }))}
                        className="p-2 bg-red-650 hover:bg-red-700 text-white rounded-full transition-transform active:scale-90"
                        title="Delete Image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleImageDrop(e, true)}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-indigo-500 rounded-2xl p-6 text-center bg-slate-50/50 dark:bg-slate-955/20 transition-colors flex flex-col items-center justify-center cursor-pointer min-h-[140px]"
                    onClick={() => document.getElementById("edit-primary-file")?.click()}
                  >
                    <input 
                      type="file" 
                      id="edit-primary-file" 
                      accept="image/*" 
                      onChange={(e) => handleImageFileChange(e, true)} 
                      className="hidden" 
                    />
                    <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Drag & drop photo or click to upload</p>
                    <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, WebP up to 5MB (compressed automatically)</p>
                  </div>
                )}
                
                <input 
                  type="text" 
                  placeholder="Or paste an image URL here..." 
                  value={editForm.image}
                  onChange={(e) => setEditForm(prev => ({ ...prev, image: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-955 border rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono font-semibold"
                />
              </div>

              {/* Gallery Images Uploader */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Gallery Images (Multiple)</label>
                
                <div className="grid grid-cols-4 gap-2">
                  {(editForm.galleryInput ? editForm.galleryInput.split(",").map(i => i.trim()).filter(Boolean) : []).map((imgUrl, idx) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden border aspect-square bg-slate-50 group">
                      <img src={imgUrl} alt={`Gallery preview ${idx}`} className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => removeGalleryImage(idx, true)}
                        className="absolute top-1 right-1 p-1 bg-red-650 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                  
                  <div 
                    onClick={() => document.getElementById("edit-gallery-file")?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-indigo-500 rounded-lg flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-955/20 cursor-pointer aspect-square"
                  >
                    <input 
                      type="file" 
                      id="edit-gallery-file" 
                      accept="image/*" 
                      multiple 
                      onChange={(e) => handleGalleryFilesChange(e, true)} 
                      className="hidden" 
                    />
                    <Plus className="w-4 h-4 text-slate-400" />
                    <span className="text-[8px] font-bold text-slate-400 mt-1">Add Photos</span>
                  </div>
                </div>
                
                <input 
                  type="text" 
                  placeholder="Or paste comma separated image URLs..." 
                  value={editForm.galleryInput}
                  onChange={(e) => setEditForm(prev => ({ ...prev, galleryInput: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-955 border rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Modifications</>}
            </button>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-2.5 rounded-xl font-bold text-xs"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Products list table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900/50">
                <th className="p-4 px-6">Image</th>
                <th className="p-4 px-6">Item Name</th>
                <th className="p-4 px-6">Category</th>
                <th className="p-4 px-6">Quality</th>
                <th className="p-4 px-6">Price & Stock</th>
                <th className="p-4 px-6">Status</th>
                <th className="p-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-800/50">
              {products.map((prod) => {
                let parsedGallery: string[] = [];
                try {
                  if (prod.images) {
                    parsedGallery = JSON.parse(prod.images);
                  }
                } catch (e) {
                  parsedGallery = [];
                }

                return (
                  <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 px-6">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border relative flex items-center justify-center text-sm font-bold">
                        <img 
                          src={prod.image || getProductPlaceholder(prod.name)} 
                          alt={prod.name} 
                          className="object-cover w-full h-full" 
                          onError={(e) => {
                            e.currentTarget.src = getProductPlaceholder(prod.name);
                          }} 
                        />
                      </div>
                    </td>
                    <td className="p-4 px-6">
                      <div className="font-bold text-slate-800 dark:text-slate-250">{prod.name}</div>
                      {prod.description && (
                        <div className="text-[10px] text-slate-450 dark:text-slate-500 line-clamp-1 mt-0.5">{prod.description}</div>
                      )}
                      {parsedGallery.length > 0 && (
                        <div className="flex items-center gap-1 text-[9px] text-indigo-500 font-bold mt-1">
                          <ImageIcon className="w-3 h-3" />
                          <span>Gallery: {parsedGallery.length} images</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 px-6 font-semibold text-slate-500">{prod.category}</td>
                    <td className="p-4 px-6">
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400">
                        {prod.quality || "Premium"}
                      </span>
                    </td>
                    <td className="p-4 px-6">
                      <div className="font-bold text-slate-800 dark:text-slate-205 flex flex-col gap-0.5">
                        <span className="flex items-center text-xs">
                          <IndianRupee className="w-3 h-3 pt-px" /> 
                          {(prod.price - (prod.price * (prod.discount / 100))).toFixed(2)}
                          <span className="text-[10px] text-slate-450 font-medium ml-1">per {prod.unit}</span>
                        </span>
                        {prod.discount > 0 && (
                          <span className="text-[9px] font-black text-emerald-650 bg-emerald-50 dark:bg-emerald-950/25 dark:text-emerald-400 w-fit px-1.5 py-px rounded mt-0.5">
                            Save {prod.discount}% (Reg. ₹{prod.price})
                          </span>
                        )}
                        <span className="text-[10px] font-semibold text-slate-400 pt-0.5">
                          Stock: {prod.stock} items
                        </span>
                      </div>
                    </td>
                    <td className="p-4 px-6">
                      <button 
                        onClick={() => handleToggleStock(prod.id, prod.inStock)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all ${
                          prod.inStock 
                            ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border border-green-200/30" 
                            : "bg-red-50 text-red-700 dark:bg-red-955/20 dark:text-red-400 border border-red-200/30"
                        }`}
                        title="Click to toggle availability"
                      >
                        {prod.inStock ? (
                          <><ToggleRight className="w-4 h-4 text-green-600" /> Active</>
                        ) : (
                          <><ToggleLeft className="w-4 h-4 text-red-500" /> Disabled</>
                        )}
                      </button>
                    </td>
                    <td className="p-4 px-6 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => startEdit(prod)}
                          className="p-2 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/30 rounded-xl border border-transparent hover:border-indigo-200/20 text-slate-500 hover:text-indigo-600 transition-colors"
                          title="Edit product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id, prod.name)}
                          className="p-2 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-955/20 rounded-xl border border-transparent hover:border-rose-200/20 text-slate-500 hover:text-rose-600 transition-colors"
                          title="Delete store product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">No inventory products registered for this shop. Click "Add Product Offering" above to populate your catalog!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
