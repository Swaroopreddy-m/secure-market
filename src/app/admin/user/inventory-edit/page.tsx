"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, Save, X, Loader2, AlertCircle, CheckCircle2, Upload, ImageIcon
} from "lucide-react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
}

function InventoryEditForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    shortDescription: "",
    categoryId: "",
    price: "0.00",
    quantity: "0",
    availability: "AVAILABLE",
    imageUrl: ""
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Product ID is missing in query parameters.");
      setIsLoading(false);
      return;
    }

    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch(`/api/merchant/inventory/${id}`),
          fetch("/api/merchant/categories")
        ]);

        if (!prodRes.ok) throw new Error("Failed to load product details.");
        if (!catRes.ok) throw new Error("Failed to load categories.");

        const prodData = await prodRes.json();
        const catData = await catRes.json();

        setCategories(catData.filter((c: any) => c.approvalStatus === "APPROVED"));

        // Extract active price, inventory, and primary image
        const activePrice = prodData.prices.find((p: any) => p.status === "ACTIVE") || prodData.prices[0];
        const priceVal = activePrice ? activePrice.sellingPrice.toString() : "0.00";

        const activeInv = prodData.inventories.find((inv: any) => inv.status === "ACTIVE") || prodData.inventories[0];
        const qtyVal = activeInv ? activeInv.quantity.toString() : "0";
        const availVal = (activeInv && activeInv.status === "ACTIVE" && activeInv.quantity > 0) ? "AVAILABLE" : "OUT_OF_STOCK";

        const primaryImg = prodData.images.find((img: any) => img.isPrimary) || prodData.images[0];
        const imgUrl = primaryImg ? primaryImg.url : "";

        setFormData({
          name: prodData.name || "",
          shortDescription: prodData.shortDescription || "",
          categoryId: prodData.categoryId || "",
          price: priceVal,
          quantity: qtyVal,
          availability: availVal,
          imageUrl: imgUrl
        });

      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    // Check size: 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert("File size exceeds 10MB limit.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("productId", id);
      uploadData.append("isPrimary", "true");
      uploadData.append("submitStatus", "APPROVED");

      const res = await fetch("/api/merchant/images", {
        method: "POST",
        body: uploadData
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to upload image.");
      }

      const data = await res.json();
      setFormData(prev => ({ ...prev, imageUrl: data.url }));
      setSuccess("Product image uploaded successfully!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    // Frontend validations
    const priceVal = parseFloat(formData.price);
    const qtyVal = parseInt(formData.quantity);

    if (isNaN(priceVal) || priceVal <= 0) {
      setError("Price must be a valid positive number.");
      setIsSaving(false);
      return;
    }
    if (isNaN(qtyVal) || qtyVal < 0) {
      setError("Items Left/Quantity cannot be negative.");
      setIsSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/merchant/inventory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update inventory.");
      }

      setSuccess("Inventory details saved and updated on storefront successfully!");
      setTimeout(() => {
        router.push("/admin/user/check-items");
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/user/check-items"
          className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Edit Inventory Item</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Modify stock quantity, pricing, basic details, and storefront image.</p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/30 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-450 text-xs font-bold animate-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-955/20 border border-green-100 dark:border-green-900/30 p-4 rounded-2xl flex items-center gap-3 text-green-600 dark:text-green-450 text-xs font-bold animate-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm space-y-6">
        
        {/* Product Image */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Product Picture</label>
          <div className="flex items-center gap-6">
            <div className="w-28 h-28 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-955 border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-center relative group">
              {formData.imageUrl ? (
                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-8 h-8 text-slate-350" />
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="relative inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold shadow-sm cursor-pointer transition-all">
                <Upload className="w-4 h-4" />
                Upload New Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
              <p className="text-[10px] text-slate-450 font-bold">Max size: 10MB. Formats: JPG, PNG, WEBP.</p>
            </div>
          </div>
        </div>

        {/* Product Name */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Product Name</label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Fresh Organic Tomatoes"
            className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
          />
        </div>

        {/* Short Description */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Short Description</label>
          <textarea
            name="shortDescription"
            rows={3}
            value={formData.shortDescription}
            onChange={handleChange}
            placeholder="Brief details about the item..."
            className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Category */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Category</label>
            <select
              name="categoryId"
              required
              value={formData.categoryId}
              onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-xs font-bold focus:outline-none text-foreground cursor-pointer"
            >
              <option value="" disabled>Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Price (₹)</label>
            <input
              type="number"
              step="0.01"
              name="price"
              required
              value={formData.price}
              onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            />
          </div>

          {/* Items Left */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Items Left / Quantity</label>
            <input
              type="number"
              name="quantity"
              required
              value={formData.quantity}
              onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            />
          </div>

          {/* Availability */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Availability</label>
            <select
              name="availability"
              required
              value={formData.availability}
              onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-xs font-bold focus:outline-none text-foreground cursor-pointer"
            >
              <option value="AVAILABLE">Available</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/50">
          <Link
            href="/admin/user/check-items"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 rounded-2xl text-xs font-bold transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-primary text-white rounded-2xl text-xs font-black shadow-md cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

export default function InventoryEditPage() {
  return (
    <Suspense fallback={
      <div className="py-24 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <InventoryEditForm />
    </Suspense>
  );
}
