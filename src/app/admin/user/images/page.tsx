"use client";

import { useState, useEffect } from "react";
import { 
  ImageIcon, Plus, Search, Trash2, Send, Save, Loader2, AlertCircle, CheckCircle2, X, Upload
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  code: string;
}

interface ImageRecord {
  id: string;
  productId: string;
  product: Product;
  url: string;
  isPrimary: boolean;
  isThumbnail: boolean;
  status: string;
  approvalStatus: string;
}

export default function MerchantImagesPage() {
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [isPrimary, setIsPrimary] = useState(true);
  const [isThumbnail, setIsThumbnail] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [imgRes, prodRes] = await Promise.all([
        fetch("/api/merchant/images"),
        fetch("/api/merchant/products")
      ]);

      if (!imgRes.ok || !prodRes.ok) throw new Error("Failed to load product images.");

      const imgData = await imgRes.json();
      const prodData = await prodRes.json();

      setImages(imgData);
      setProducts(prodData.filter((p: any) => p.approvalStatus === "APPROVED")); // only approved products
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleOpenCreate = () => {
    if (products.length === 0) {
      alert("You must have at least one approved product before uploading images.");
      return;
    }
    setSelectedProductId(products[0]?.id || "");
    setIsPrimary(true);
    setIsThumbnail(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setSuccess(null);
    setShowForm(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Size check
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      setError("File exceeds 10MB size limit.");
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    // Format check
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Unsupported format. Please select a JPG, PNG or WEBP image.");
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async (submitStatus: "DRAFT" | "PENDING") => {
    if (!selectedProductId || !selectedFile) {
      setError("Please select a Product and choose a valid image file.");
      return;
    }

    setIsSubmitLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("productId", selectedProductId);
      formData.append("isPrimary", String(isPrimary));
      formData.append("isThumbnail", String(isThumbnail));
      formData.append("submitStatus", submitStatus);

      const res = await fetch("/api/merchant/images", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload image.");

      setSuccess(`Image uploaded successfully under status ${submitStatus === "PENDING" ? "Pending Approval" : "Draft"}.`);
      setShowForm(false);
      fetchInitialData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const filteredImages = images.filter(img =>
    img.product.name.toLowerCase().includes(search.toLowerCase())
  );

  const getBadgeClass = (appStatus: string, finalStatus: string) => {
    switch (appStatus) {
      case "APPROVED":
        return "bg-green-50 text-green-700 dark:bg-green-950/20 border border-green-200/50";
      case "PENDING":
        return "bg-amber-50 text-amber-700 dark:bg-amber-955/20 border border-amber-200/50";
      case "REJECTED":
        return "bg-rose-50 text-rose-705 dark:bg-rose-955/20 border border-rose-200/50";
      case "RETURNED":
        return "bg-slate-105 text-slate-700 dark:bg-slate-800 border border-slate-200/50";
      default:
        return "bg-slate-50 text-slate-505 border border-slate-200/50";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 p-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Product Images</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Upload product thumbnail lists, primary marketplace images, and manage gallery photos.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-1.5 px-5 py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-indigo-655/20 active:scale-95 transition-all"
          >
            <Upload className="w-4 h-4" /> Upload Image
          </button>
        )}
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 dark:bg-rose-955/20 dark:border-rose-900/30 dark:text-rose-455 p-4 rounded-2xl text-xs font-bold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {showForm ? (
        /* Upload Form */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm space-y-6 max-w-xl mx-auto">
          <div className="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-slate-850">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
              Upload Image Asset
            </h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-655">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Select Product</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>

            {/* Drag & Drop File input */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Image File (Max 10MB)</label>
              <div className="border-2 border-dashed border-slate-250 dark:border-slate-800 hover:border-indigo-500/50 rounded-3xl p-6 text-center transition-all relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <Upload className="w-8 h-8 text-slate-400 animate-bounce" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    {selectedFile ? selectedFile.name : "Drag & Drop or click to browse files"}
                  </p>
                  <p className="text-[10px] text-slate-400">Supported formats: JPG, JPEG, PNG, WEBP</p>
                </div>
              </div>
            </div>

            {previewUrl && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Preview</label>
                <div className="relative w-36 h-36 border dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500"
                />
                Make Primary Marketplace Image
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isThumbnail}
                  onChange={(e) => setIsThumbnail(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-655 focus:ring-indigo-550"
                />
                Make Thumbnail Catalog Icon
              </label>
            </div>

          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
            <button
              onClick={() => handleUpload("DRAFT")}
              disabled={isSubmitLoading}
              className="flex items-center justify-center gap-1.5 px-5 py-3 border border-indigo-655 text-indigo-655 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-2xl font-bold text-xs active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" /> Save Draft
            </button>
            <button
              onClick={() => handleUpload("PENDING")}
              disabled={isSubmitLoading}
              className="flex items-center justify-center gap-1.5 px-5 py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs active:scale-95 transition-all shadow-md shadow-indigo-655/25"
            >
              <Send className="w-4 h-4" /> Submit Image
            </button>
          </div>

        </div>
      ) : (
        /* Image Grid list */
        <>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search images by product name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 focus:outline-none text-xs font-bold text-slate-750 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {isLoading ? (
              <div className="col-span-full py-12 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-650" />
                Loading image catalog...
              </div>
            ) : filteredImages.length > 0 ? (
              filteredImages.map((img) => (
                <div key={img.id} className="bg-white dark:bg-slate-900 border dark:border-slate-800/60 rounded-3xl overflow-hidden shadow-sm flex flex-col group hover:shadow-md transition-all">
                  <div className="relative aspect-square bg-slate-100 dark:bg-slate-955/40 overflow-hidden">
                    <img src={img.url} alt={img.product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    {img.isPrimary && (
                      <span className="absolute top-2 left-2 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                        Primary
                      </span>
                    )}
                  </div>
                  <div className="p-4 space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-850 dark:text-slate-100 truncate">{img.product.name}</h4>
                      <div className="text-[10px] text-slate-400 font-semibold">{img.isThumbnail ? "Thumbnail" : "Gallery Image"}</div>
                    </div>
                    <span className={`self-start px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getBadgeClass(img.approvalStatus, img.status)}`}>
                      {img.approvalStatus}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-slate-400 font-bold">
                No product images uploaded. Click "Upload Image" to start.
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
