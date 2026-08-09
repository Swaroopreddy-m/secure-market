"use client";

import { useState, useEffect } from "react";
import { 
  Folder, Plus, Search, Trash2, Edit3, Send, Save, Loader2, AlertCircle, CheckCircle2, X
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  code: string;
  description: string;
  displayOrder: number;
  status: string;
  approvalStatus: string;
  remarks: string;
}

export default function MerchantCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    displayOrder: "0",
    status: "ACTIVE",
    remarks: ""
  });

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/merchant/categories");
      if (!res.ok) throw new Error("Failed to load categories catalog.");
      const data = await res.json();
      setCategories(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenCreate = () => {
    setEditId(null);
    setFormData({
      name: "",
      description: "",
      displayOrder: "0",
      status: "ACTIVE",
      remarks: ""
    });
    setError(null);
    setSuccess(null);
    setShowForm(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditId(cat.id);
    setFormData({
      name: cat.name,
      description: cat.description || "",
      displayOrder: String(cat.displayOrder),
      status: cat.status,
      remarks: cat.remarks || ""
    });
    setError(null);
    setSuccess(null);
    setShowForm(true);
  };

  const handleSaveOrSubmit = async (submitStatus: "DRAFT" | "PENDING") => {
    if (!formData.name) {
      setError("Category Name is required.");
      return;
    }

    setIsSubmitLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const url = editId 
        ? `/api/merchant/categories/${editId}` 
        : "/api/merchant/categories";
      
      const method = editId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, submitStatus })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save category");

      setSuccess(`Category successfully ${editId ? "updated" : "created"} with status ${submitStatus === "PENDING" ? "Pending Approval" : "Draft"}.`);
      setShowForm(false);
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const conf = window.confirm(`Are you sure you want to delete category ${name}? If Delete Approval is enabled, this will submit a request to the Product Admin.`);
    if (!conf) return;

    setIsSubmitLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/merchant/categories/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process delete request");

      setSuccess(data.message || "Category successfully deleted.");
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const getBadgeClass = (appStatus: string, finalStatus: string) => {
    if (finalStatus === "PENDING_DELETE") {
      return "bg-rose-50 text-rose-700 dark:bg-rose-950/20 border border-rose-200/50";
    }
    switch (appStatus) {
      case "APPROVED":
        return "bg-green-50 text-green-700 dark:bg-green-950/20 border border-green-200/50";
      case "PENDING":
        return "bg-amber-50 text-amber-700 dark:bg-amber-955/20 border border-amber-200/50";
      case "REJECTED":
        return "bg-rose-50 text-rose-700 dark:bg-rose-955/20 border border-rose-200/50";
      case "RETURNED":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 border border-slate-200/50";
      default:
        return "bg-slate-50 text-slate-500 border border-slate-200/50";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 p-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Category Assignments</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Create or edit categories assigned to your tenant storefront catalog.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-1.5 px-5 py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-indigo-655/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Category
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
        <div className="bg-rose-50 border border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-455 p-4 rounded-2xl text-xs font-bold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {showForm ? (
        /* Create/Edit Form */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm space-y-6 max-w-xl mx-auto">
          <div className="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-slate-850">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
              {editId ? "Modify Category" : "Register Category"}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Category Name</label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Organic Fruits"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Display Order</label>
              <input
                type="number"
                name="displayOrder"
                value={formData.displayOrder}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Description</label>
              <textarea
                name="description"
                rows={3}
                placeholder="Details about items under this category..."
                value={formData.description}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Category Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Remarks / Maker Notes</label>
              <textarea
                name="remarks"
                rows={2}
                placeholder="Provide comments or justifications for the reviewer..."
                value={formData.remarks}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-850">
            <button
              onClick={() => handleSaveOrSubmit("DRAFT")}
              disabled={isSubmitLoading}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 border border-indigo-650 text-indigo-650 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-2xl font-bold text-xs active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" /> Save Draft
            </button>
            <button
              onClick={() => handleSaveOrSubmit("PENDING")}
              disabled={isSubmitLoading}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs active:scale-95 transition-all shadow-md shadow-indigo-655/25"
            >
              <Send className="w-4 h-4" /> Submit Review
            </button>
          </div>

        </div>
      ) : (
        /* List grid */
        <>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-55 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 focus:outline-none text-xs font-bold text-slate-750 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/40 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850">
                    <th className="p-4">Category Code</th>
                    <th className="p-4">Category Name</th>
                    <th className="p-4 text-center">Display Order</th>
                    <th className="p-4">Approval Status</th>
                    <th className="p-4">Active Status</th>
                    <th className="p-4">Remarks</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-semibold text-slate-655 dark:text-slate-350">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-650" />
                        Fetching categories catalog...
                      </td>
                    </tr>
                  ) : filteredCategories.length > 0 ? (
                    filteredCategories.map((c) => {
                      const isEditable = c.approvalStatus !== "PENDING";
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">{c.code}</td>
                          <td className="p-4">
                            <div className="font-bold text-slate-800 dark:text-slate-100">{c.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{c.description || "No description"}</div>
                          </td>
                          <td className="p-4 text-center font-bold">{c.displayOrder}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getBadgeClass(c.approvalStatus, c.status)}`}>
                              {c.approvalStatus}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              c.status === "ACTIVE" ? "bg-green-50 text-green-700 dark:bg-green-950/20" : "bg-slate-100 text-slate-500"
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="p-4 max-w-xs truncate text-[11px] font-medium text-slate-450" title={c.remarks}>
                            {c.remarks || "-"}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {isEditable ? (
                                <>
                                  <button
                                    onClick={() => handleOpenEdit(c)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-650 rounded-xl transition-all"
                                    title="Edit Category"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(c.id, c.name)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-650 rounded-xl transition-all"
                                    title="Delete Category"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Locked (Reviewing)</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                        No categories found. Click "Create Category" to build one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
