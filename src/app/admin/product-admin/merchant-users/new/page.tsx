"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  UserPlus, Save, Send, RotateCcw, X, Loader2, AlertCircle, CheckCircle2, ShieldCheck, Building2
} from "lucide-react";

function CreateUserForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const cloneId = searchParams.get("clone");

  // App Identity
  const [appName, setAppName] = useState("Loading...");
  
  // Form Fields
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    mobile: "",
    department: "",
    designation: "",
    reportingManager: "",
    remarks: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchLoading, setIsFetchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch application details and initial user details if editing/cloning
  useEffect(() => {
    const initPage = async () => {
      setIsFetchLoading(true);
      try {
        const appRes = await fetch("/api/product-admin/application");
        if (appRes.ok) {
          const appData = await appRes.json();
          setAppName(appData.name);
        }

        const targetId = editId || cloneId;
        if (targetId) {
          const usersRes = await fetch("/api/product-admin/merchant-users");
          if (usersRes.ok) {
            const users = await usersRes.json();
            const u = users.find((usr: any) => usr.id === targetId);
            if (u) {
              setFormData({
                firstName: u.firstName || "",
                lastName: u.lastName || "",
                username: editId ? (u.username || "") : "", // do not clone username
                password: "",
                confirmPassword: "",
                email: editId ? (u.email || "") : "", // do not clone email
                mobile: u.mobile || "",
                department: u.department || "",
                designation: u.designation || "",
                reportingManager: u.reportingManager || "",
                remarks: u.remarks || ""
              });
            }
          }
        }
      } catch (err: any) {
        console.error(err);
      } finally {
        setIsFetchLoading(false);
      }
    };
    initPage();
  }, [editId, cloneId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData({
      firstName: "",
      lastName: "",
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      mobile: "",
      department: "",
      designation: "",
      reportingManager: "",
      remarks: ""
    });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (submitStatus: "DRAFT" | "PENDING") => {
    setError(null);
    setSuccess(null);

    // Basic password confirmation check
    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    } else if (!editId) {
      setError("Password is required for new users.");
      return;
    }

    setIsLoading(true);
    try {
      const url = editId 
        ? `/api/product-admin/merchant-users/${editId}` 
        : "/api/product-admin/merchant-users";
      
      const method = editId ? "PATCH" : "POST";

      const payload = {
        ...formData,
        submitStatus
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit request.");

      setSuccess(`Merchant User successfully ${editId ? "updated" : "created"} in ${submitStatus === "PENDING" ? "Pending Approval" : "Draft"} status.`);
      
      // Clear form on create success
      if (!editId) {
        handleReset();
      }

      // Redirect to list after short delay
      setTimeout(() => {
        router.push("/admin/product-admin/merchant-users");
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-650" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-3xl mx-auto p-6">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
          {editId ? "Modify Merchant User (Maker)" : "Create Merchant User (Maker)"}
        </h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Set up credentials, department roles, and details for a new Merchant User.
        </p>
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

      {/* Main card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm space-y-6">
        
        {/* Read only info */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-indigo-500" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Application</p>
              <p className="text-xs font-extrabold text-slate-850 dark:text-slate-200 mt-0.5">{appName}</p>
            </div>
          </div>
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 border-l sm:border-l sm:pl-4 pl-0 py-0.5 uppercase tracking-widest">
            Employee ID: {editId ? "Auto Generated (Locked)" : "Auto Generated on Submission"}
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">First Name</label>
            <input
              type="text"
              name="firstName"
              required
              placeholder="e.g. John"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Last Name</label>
            <input
              type="text"
              name="lastName"
              required
              placeholder="e.g. Doe"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Username</label>
            <input
              type="text"
              name="username"
              required
              placeholder="e.g. jdoe_merchant"
              value={formData.username}
              onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              name="email"
              required
              placeholder="e.g. jdoe@securemarket.local"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Mobile Number</label>
            <input
              type="text"
              name="mobile"
              required
              placeholder="e.g. +91 9876543210"
              value={formData.mobile}
              onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Department</label>
            <input
              type="text"
              name="department"
              placeholder="e.g. Retail, Inventory, Billing"
              value={formData.department}
              onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Designation</label>
            <input
              type="text"
              name="designation"
              placeholder="e.g. Shop Manager"
              value={formData.designation}
              onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Reporting Manager</label>
            <input
              type="text"
              name="reportingManager"
              placeholder="e.g. Sarah Principal"
              value={formData.reportingManager}
              onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Password</label>
            <input
              type="password"
              name="password"
              placeholder={editId ? "•••••••• (Leave blank to keep current)" : "••••••••"}
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder={editId ? "••••••••" : "••••••••"}
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all"
            />
          </div>

          <div className="col-span-1 md:col-span-2 space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Remarks</label>
            <textarea
              name="remarks"
              rows={3}
              placeholder="Provide comments or audit justifications here..."
              value={formData.remarks}
              onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800 dark:text-slate-200"
            />
          </div>

        </div>

        {/* Buttons Action Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleReset}
              className="w-1/2 sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-slate-50 dark:bg-slate-800 border hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-200 rounded-2xl font-bold text-xs active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/product-admin/merchant-users")}
              className="w-1/2 sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-slate-50 dark:bg-slate-800 border hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-200 rounded-2xl font-bold text-xs active:scale-95 transition-all"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleSubmit("DRAFT")}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 border border-indigo-650 text-indigo-650 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-2xl font-bold text-xs active:scale-95 transition-all"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Draft
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleSubmit("PENDING")}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs active:scale-95 transition-all shadow-md shadow-indigo-650/25"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit Approval
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}

export default function CreateUserPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" /></div>}>
      <CreateUserForm />
    </Suspense>
  );
}
