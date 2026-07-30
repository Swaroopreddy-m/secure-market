"use client";

import { useState, useEffect } from "react";
import { 
  Save, Send, RotateCcw, X, AlertCircle, CheckCircle, 
  Trash2, Edit2, Copy, Play, Loader2, Building2, User, Key, Eye, EyeOff, ClipboardList, ShieldAlert
} from "lucide-react";

interface ApplicationOption {
  id: string;
  name: string;
}

interface ProductAdminRecord {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  name: string;
  username: string;
  email: string;
  mobile: string;
  department: string;
  designation: string;
  status: string;
  remarks: string;
  userApprovalStatus: string;
  roleMatrixStatus: string;
  makerUsername: string;
  checkerUsername: string;
  createdAt: string;
  applicationId: string;
  applicationName: string;
}

export default function ProductAdminMakerPage() {
  const [admins, setAdmins] = useState<ProductAdminRecord[]>([]);
  const [apps, setApps] = useState<ApplicationOption[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    applicationId: "",
    employeeId: "",
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    mobile: "",
    department: "",
    designation: "",
    remarks: "",
    userApprovalStatus: "PENDING" as "DRAFT" | "PENDING"
  });

  // Editing/Cloning state
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // UI States
  const [activeTab, setActiveTab] = useState<"DRAFT" | "PENDING" | "REJECTED" | "RETURNED">("PENDING");
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [adminsRes, appsRes] = await Promise.all([
        fetch("/api/super-admin/product-admins"),
        fetch("/api/super-admin/applications")
      ]);
      if (!adminsRes.ok || !appsRes.ok) throw new Error("Failed to load Product Admins metadata");
      const adminsData = await adminsRes.json();
      const appsData = await appsRes.json();
      setAdmins(adminsData);
      setApps(appsData);

      if (appsData.length > 0 && !formData.applicationId) {
        setFormData(prev => ({ ...prev, applicationId: appsData[0].id }));
      }

      // Propose employee ID sequentially
      const count = adminsData.length;
      setFormData(prev => ({ ...prev, employeeId: `PAD-${(count + 1).toString().padStart(4, "0")}` }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReset = () => {
    const nextNum = admins.length + 1;
    setFormData({
      applicationId: apps[0]?.id || "",
      employeeId: `PAD-${nextNum.toString().padStart(4, "0")}`,
      firstName: "",
      lastName: "",
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      mobile: "",
      department: "",
      designation: "",
      remarks: "",
      userApprovalStatus: "PENDING"
    });
    setIsEditing(false);
    setEditId(null);
    setError(null);
  };

  const handleSaveOrSubmit = async (approvalStatus: "DRAFT" | "PENDING") => {
    setError(null);
    setSuccess(null);

    // Password validation for new record
    if (!isEditing || formData.password) {
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setIsSaving(true);
    try {
      const url = isEditing ? `/api/super-admin/product-admins/${editId}` : "/api/super-admin/product-admins";
      const method = isEditing ? "PATCH" : "POST";

      const payload = {
        ...formData,
        userApprovalStatus: approvalStatus
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to persist Product Admin record");
      }

      setSuccess(`Product Admin successfully ${approvalStatus === "PENDING" ? "submitted for Checker approval" : "saved as Draft"}.`);
      handleReset();
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // List actions
  const handleEdit = (u: ProductAdminRecord) => {
    setFormData({
      applicationId: u.applicationId,
      employeeId: u.employeeId,
      firstName: u.firstName,
      lastName: u.lastName,
      username: u.username,
      password: "",
      confirmPassword: "",
      email: u.email,
      mobile: u.mobile,
      department: u.department,
      designation: u.designation,
      remarks: u.remarks,
      userApprovalStatus: "PENDING"
    });
    setEditId(u.id);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClone = (u: ProductAdminRecord) => {
    const nextNum = admins.length + 1;
    setFormData({
      applicationId: u.applicationId,
      employeeId: `PAD-${nextNum.toString().padStart(4, "0")}`,
      firstName: u.firstName,
      lastName: u.lastName,
      username: `${u.username}_clone`,
      password: "",
      confirmPassword: "",
      email: `clone_${u.email}`,
      mobile: u.mobile,
      department: u.department,
      designation: u.designation,
      remarks: `Cloned from ${u.employeeId}`,
      userApprovalStatus: "DRAFT"
    });
    setIsEditing(false);
    setEditId(null);
    setSuccess(`Cloned details from ${u.employeeId}. Please configure username and password to save.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Product Admin record?")) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/super-admin/product-admins/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete record");
      }
      setSuccess("Product Admin deleted successfully.");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResubmit = async (u: ProductAdminRecord) => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/super-admin/product-admins/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userApprovalStatus: "PENDING" })
      });
      if (!res.ok) throw new Error("Failed to resubmit record");
      setSuccess(`Product Admin ${u.username} successfully resubmitted to Checker.`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const draftRecords = admins.filter(u => u.userApprovalStatus === "DRAFT");
  const pendingRecords = admins.filter(u => u.userApprovalStatus === "PENDING");
  const rejectedRecords = admins.filter(u => u.userApprovalStatus === "REJECTED");
  const returnedRecords = admins.filter(u => u.userApprovalStatus === "RETURNED");

  const getRecordsByTab = () => {
    switch (activeTab) {
      case "DRAFT": return draftRecords;
      case "PENDING": return pendingRecords;
      case "REJECTED": return rejectedRecords;
      case "RETURNED": return returnedRecords;
    }
  };

  const tabRecords = getRecordsByTab();

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Create Product Admin (Maker)</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Register new Product Admins under your applications. Maker submissions are sent for Checker confirmation.</p>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/30 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-450 text-xs font-bold animate-in fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-955/20 border border-green-100 dark:border-green-900/30 p-4 rounded-2xl flex items-center gap-3 text-green-600 dark:text-green-450 text-xs font-bold animate-in fade-in">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Main Creation Card Form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm p-8">
        <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-650" />
          <span>{isEditing ? `Modify Product Admin: ${formData.employeeId}` : "Product Admin Details Form"}</span>
        </h3>

        <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            
            {/* Application */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Target Application</label>
              <select
                value={formData.applicationId}
                onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-4 text-xs font-bold text-foreground focus:outline-none"
              >
                {apps.map((app) => (
                  <option key={app.id} value={app.id}>{app.name}</option>
                ))}
                {apps.length === 0 && (
                  <option value="">No applications configured</option>
                )}
              </select>
            </div>

            {/* Employee ID */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Employee ID</label>
              <input
                type="text"
                disabled
                value={formData.employeeId}
                placeholder="PAD-0001"
                className="w-full bg-slate-100 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-4 text-xs font-mono font-bold text-slate-500 cursor-not-allowed"
              />
            </div>

            {/* First Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="e.g. John"
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-4 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Last Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="e.g. Doe"
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-4 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Username */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g. john_doe"
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-4 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Password */}
            <div className="space-y-1 relative">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Key className="w-3.5 h-3.5" /> Password {isEditing && "(Leave blank to keep same)"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="******"
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-4 pr-10 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="******"
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-4 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john.doe@company.com"
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-4 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Mobile */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Mobile Number</label>
              <input
                type="text"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="e.g. +91 9900887766"
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-4 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Department */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Retail Groceries"
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-4 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Designation */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Designation</label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="e.g. Store Manager"
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-4 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Remarks */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Maker Remarks</label>
              <input
                type="text"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Provide details or reference for Checker..."
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-4 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

          </div>

          {/* Form Actions */}
          <div className="flex flex-wrap gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 justify-end">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleReset}
              className="px-5 py-2.5 bg-white dark:bg-slate-900 border dark:border-slate-800 hover:bg-slate-50 rounded-2xl text-xs font-bold text-slate-655 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Reset Form
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveOrSubmit("DRAFT")}
              className="px-5 py-2.5 bg-white dark:bg-slate-900 border dark:border-slate-800 hover:bg-slate-50 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Draft
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveOrSubmit("PENDING")}
              className="px-6 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-650/20 flex items-center gap-1.5 cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit to Checker
            </button>
          </div>
        </form>

      </div>

      {/* Tabs list of registered admins */}
      <div className="space-y-4">
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
          {(["PENDING", "DRAFT", "REJECTED", "RETURNED"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-xs font-black transition-all border-b-2 px-1 cursor-pointer uppercase tracking-wider flex items-center gap-1.5 ${
                activeTab === tab 
                  ? "border-indigo-650 text-indigo-650 font-black" 
                  : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              {tab} Records ({
                tab === "PENDING" ? pendingRecords.length :
                tab === "DRAFT" ? draftRecords.length :
                tab === "REJECTED" ? rejectedRecords.length :
                returnedRecords.length
              })
            </button>
          ))}
        </div>

        {/* List Grid */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden animate-in fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/50">
                  <th className="p-4 px-6">Employee ID</th>
                  <th className="p-4 px-6">Product Admin</th>
                  <th className="p-4 px-6">Application</th>
                  <th className="p-4 px-6">Designation</th>
                  <th className="p-4 px-6">Maker Remarks</th>
                  <th className="p-4 px-6 text-center">Lifecycle</th>
                  <th className="p-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-800/50">
                {tabRecords.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="p-4 px-6 font-mono font-bold text-[10px] text-slate-850 dark:text-slate-200">
                      {u.employeeId}
                    </td>
                    <td className="p-4 px-6">
                      <div>
                        <p className="font-extrabold text-slate-850 dark:text-slate-150">{u.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">@{u.username}</p>
                        <p className="text-[9px] font-mono text-slate-450 dark:text-slate-550">{u.email}</p>
                      </div>
                    </td>
                    <td className="p-4 px-6 font-extrabold text-indigo-650 dark:text-indigo-400">
                      {u.applicationName}
                    </td>
                    <td className="p-4 px-6 font-medium text-slate-700 dark:text-slate-350">{u.designation || "N/A"}</td>
                    <td className="p-4 px-6 font-medium text-slate-400 truncate max-w-[200px]" title={u.remarks}>
                      {u.remarks || "No remarks"}
                    </td>
                    <td className="p-4 px-6 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        u.userApprovalStatus === "PENDING" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30" :
                        u.userApprovalStatus === "REJECTED" ? "bg-rose-50 text-rose-700 dark:bg-rose-955/20" :
                        u.userApprovalStatus === "RETURNED" ? "bg-slate-100 text-slate-700 dark:bg-slate-800" :
                        "bg-slate-50 text-slate-655"
                      }`}>
                        {u.userApprovalStatus}
                      </span>
                    </td>
                    <td className="p-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Clone */}
                        <button
                          title="Clone Record"
                          onClick={() => handleClone(u)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-xl transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit (only draft/rejected/returned can be edited) */}
                        {u.userApprovalStatus !== "PENDING" && (
                          <button
                            title="Edit Record"
                            onClick={() => handleEdit(u)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-xl transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Resubmit (only returned/rejected) */}
                        {(u.userApprovalStatus === "RETURNED" || u.userApprovalStatus === "REJECTED") && (
                          <button
                            title="Resubmit to Checker"
                            onClick={() => handleResubmit(u)}
                            className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-xl transition-colors cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete (only draft/rejected/returned can be deleted) */}
                        {u.userApprovalStatus !== "PENDING" && (
                          <button
                            title="Delete Draft"
                            onClick={() => handleDelete(u.id)}
                            className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-xl transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                      </div>
                    </td>
                  </tr>
                ))}
                {tabRecords.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">No product admin records found in this category.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
