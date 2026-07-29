"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Save, Send, RotateCcw, X, AlertCircle, CheckCircle, 
  Trash2, Edit2, Copy, Play, Loader2, Building2, User, Key, Eye, EyeOff, ClipboardList
} from "lucide-react";

interface OrganizationOption {
  id: string;
  name: string;
  code: string;
}

interface UserLifecycleRecord {
  id: string;
  employeeId: string | null;
  username: string | null;
  name: string | null;
  email: string | null;
  role: string;
  department: string | null;
  status: string;
  userApprovalStatus: string | null;
  roleMatrixStatus: string | null;
  firstName?: string | null;
  lastName?: string | null;
  mobile?: string | null;
  designation?: string | null;
  remarks?: string | null;
  organizationId?: string | null;
  createdAt: string | Date;
}

interface MakerUserWorkspaceProps {
  organizations: OrganizationOption[];
  initialUsers: UserLifecycleRecord[];
}

export default function MakerUserWorkspace({
  organizations,
  initialUsers
}: MakerUserWorkspaceProps) {
  const router = useRouter();
  
  // List of all user records under Developer Maker scope
  const [users, setUsers] = useState<UserLifecycleRecord[]>(initialUsers);
  
  // Form State
  const [formData, setFormData] = useState({
    organizationId: "",
    employeeId: "",
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    mobile: "",
    designation: "",
    department: "SUPER_ADMIN_DEFAULT",
    remarks: ""
  });

  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // UI States
  const [activeTab, setActiveTab] = useState<"DRAFT" | "PENDING" | "REJECTED" | "RETURNED">("PENDING");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Suggest sequential Employee ID on mount or load
  useEffect(() => {
    if (!isEditing && !formData.employeeId) {
      const nextNum = users.length + 1;
      setFormData(prev => ({ ...prev, employeeId: `EMP-${nextNum.toString().padStart(4, "0")}` }));
    }
  }, [users, isEditing, formData.employeeId]);

  // Set default organization if available
  useEffect(() => {
    if (organizations.length > 0 && !formData.organizationId) {
      setFormData(prev => ({ ...prev, organizationId: organizations[0].id }));
    }
  }, [organizations, formData.organizationId]);

  // Filters records for bottom tables
  const draftRecords = users.filter(u => u.userApprovalStatus === "DRAFT" || !u.userApprovalStatus);
  const pendingRecords = users.filter(u => u.userApprovalStatus === "PENDING");
  const rejectedRecords = users.filter(u => u.userApprovalStatus === "REJECTED");
  const returnedRecords = users.filter(u => u.userApprovalStatus === "RETURNED");

  const getRecordsByTab = () => {
    switch (activeTab) {
      case "DRAFT": return draftRecords;
      case "PENDING": return pendingRecords;
      case "REJECTED": return rejectedRecords;
      case "RETURNED": return returnedRecords;
    }
  };

  const handleReset = () => {
    const nextNum = users.length + 1;
    setFormData({
      organizationId: organizations[0]?.id || "",
      employeeId: `EMP-${nextNum.toString().padStart(4, "0")}`,
      firstName: "",
      lastName: "",
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      mobile: "",
      designation: "",
      department: "SUPER_ADMIN_DEFAULT",
      remarks: ""
    });
    setIsEditing(false);
    setEditId(null);
    setError(null);
  };

  // Submit/Save Maker record
  const handleSaveOrSubmit = async (approvalStatus: "DRAFT" | "PENDING") => {
    setError(null);
    setSuccess(null);

    // Password validations (required for creation, or editing if password field is filled)
    if (!isEditing || formData.password) {
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Password and Confirm Password do not match.");
        return;
      }
    }

    setIsLoading(true);
    try {
      const url = isEditing ? `/api/saas-users/${editId}` : "/api/saas-users";
      const method = isEditing ? "PATCH" : "POST";
      
      const payload = {
        ...formData,
        role: "SUPER_ADMIN", // Developer maker strictly creates SUPER_ADMIN users
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        userApprovalStatus: approvalStatus
      };

      const res = await fetch(url, {
        method,
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === "Validation failed" && data.details) {
          const detailMsgs = data.details.map((d: any) => d.message).join(", ");
          throw new Error(`Validation failed: ${detailMsgs}`);
        }
        throw new Error(data.error || "Failed to save user account");
      }

      const savedUser = await res.json();
      
      setSuccess(`Successfully ${isEditing ? "updated" : "created"} record as ${approvalStatus}.`);
      
      // Reload lists
      const listRes = await fetch("/api/saas-users/confirm"); // Fetch updated lists
      if (listRes.ok) {
        const updatedUsers = await listRes.json();
        setUsers(updatedUsers.filter((u: any) => u.role === "SUPER_ADMIN"));
      } else {
        router.refresh();
      }

      handleReset();
      setActiveTab(approvalStatus);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Resubmit a Rejected/Returned record instantly
  const handleResubmit = async (user: UserLifecycleRecord) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/saas-users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userApprovalStatus: "PENDING" })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to resubmit user record");
      }

      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, userApprovalStatus: "PENDING" } : u));
      setSuccess(`User "${user.username}" resubmitted successfully.`);
      setActiveTab("PENDING");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Edit action
  const handleEdit = (user: UserLifecycleRecord) => {
    setIsEditing(true);
    setEditId(user.id);
    setFormData({
      organizationId: user.organizationId || "",
      employeeId: user.employeeId || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      username: user.username || "",
      password: "", // blank for no password change
      confirmPassword: "",
      email: user.email || "",
      mobile: user.mobile || "",
      designation: user.designation || "",
      department: user.department || "SUPER_ADMIN_DEFAULT",
      remarks: user.remarks || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Clone Action
  const handleClone = (user: UserLifecycleRecord) => {
    const nextNum = users.length + 1;
    setFormData({
      organizationId: user.organizationId || "",
      employeeId: `EMP-${nextNum.toString().padStart(4, "0")}`,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      username: "", // Clear fields that must remain unique
      password: "",
      confirmPassword: "",
      email: "",
      mobile: user.mobile || "",
      designation: user.designation || "",
      department: user.department || "SUPER_ADMIN_DEFAULT",
      remarks: `Cloned from ${user.username}. ${user.remarks || ""}`.trim()
    });
    setIsEditing(false);
    setEditId(null);
    setSuccess(`Cloned settings from ${user.username}. Please enter unique username/email.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Delete Action
  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user draft/pending record "${username}"?`)) {
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/saas-users/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete record");
      }

      setUsers(prev => prev.filter(u => u.id !== id));
      setSuccess(`Deleted record "${username}" successfully.`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* 1. Maker Create/Edit Form Panel */}
      <form onSubmit={(e) => { e.preventDefault(); }} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-6 max-w-4xl mx-auto">
        <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <div className="w-1.5 h-6 bg-indigo-600 dark:bg-indigo-500 rounded-full" /> 
          {isEditing ? "Modify Super Admin Record" : "Create Super Admin User (Maker)"}
        </h3>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/30 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-xs font-bold animate-in fade-in duration-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-955/20 border border-green-100 dark:border-green-900/30 p-4 rounded-2xl flex items-center gap-3 text-green-600 dark:text-green-400 text-xs font-bold animate-in fade-in duration-300">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Target Organization</label>
            <select
              value={formData.organizationId}
              onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-foreground"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>{org.name} ({org.code})</option>
              ))}
              {organizations.length === 0 && (
                <option value="">No Active Organizations</option>
              )}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Employee ID (Auto Generated)</label>
            <input
              required
              type="text"
              placeholder="e.g. EMP-0001"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value.toUpperCase() })}
              className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-mono font-bold text-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">First Name</label>
            <input
              required
              type="text"
              placeholder="e.g. John"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Last Name</label>
            <input
              required
              type="text"
              placeholder="e.g. Doe"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Username</label>
            <input
              required
              type="text"
              placeholder="e.g. john_super"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, "") })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Email Address</label>
            <input
              required
              type="email"
              placeholder="john@organization.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase().trim() })}
              className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-foreground"
            />
          </div>

          <div className="space-y-2 relative">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Password {isEditing && "(Leave blank to keep unchanged)"}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required={!isEditing}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-foreground pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-655"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2 relative">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Confirm Password</label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              required={!isEditing || !!formData.password}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Mobile Number</label>
            <input
              type="text"
              placeholder="e.g. +91 9988776655"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Designation</label>
            <input
              type="text"
              placeholder="e.g. General Manager"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Department</label>
            <input
              type="text"
              placeholder="e.g. Administration"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-foreground"
            />
          </div>

          <div className="space-y-2 col-span-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Remarks</label>
            <input
              type="text"
              placeholder="Provide reason or remarks for account creation"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-foreground"
            />
          </div>

        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
          <button
            type="button"
            onClick={handleReset}
            disabled={isLoading}
            className="flex-1 min-w-[100px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 py-3 rounded-2xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          
          <button
            type="button"
            onClick={() => handleSaveOrSubmit("DRAFT")}
            disabled={isLoading || organizations.length === 0}
            className="flex-1 min-w-[120px] bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 py-3 rounded-2xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
            {isEditing ? "Save Draft" : "Save as Draft"}
          </button>

          <button
            type="button"
            onClick={() => handleSaveOrSubmit("PENDING")}
            disabled={isLoading || organizations.length === 0}
            className="flex-[2] min-w-[160px] bg-indigo-650 hover:bg-indigo-700 text-white py-3 rounded-2xl font-bold text-xs shadow-lg shadow-indigo-650/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} 
            {isEditing ? "Submit Update" : "Submit for Approval"}
          </button>
        </div>
      </form>

      {/* 2. Created Records Section (Tabs) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-sm">
        
        {/* Tab Headers */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto bg-slate-50 dark:bg-slate-900/50">
          {(["PENDING", "DRAFT", "REJECTED", "RETURNED"] as const).map((tab) => {
            const count = 
              tab === "PENDING" ? pendingRecords.length :
              tab === "DRAFT" ? draftRecords.length :
              tab === "REJECTED" ? rejectedRecords.length :
              returnedRecords.length;
            
            const isActive = activeTab === tab;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-black text-xs uppercase border-b-2 tracking-wider flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                  isActive 
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900" 
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
              >
                <span>{tab.replace("_", " ")}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                  isActive ? "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400" : "bg-slate-200/60 dark:bg-slate-800 text-slate-600"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-5">Employee ID</th>
                <th className="px-6 py-5">Super Admin Profile</th>
                <th className="px-6 py-5">Organization</th>
                <th className="px-6 py-5 font-mono">Status</th>
                <th className="px-6 py-5">Maker Remarks</th>
                <th className="px-6 py-5">Created Date</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-850">
              {getRecordsByTab().map((user) => {
                const org = organizations.find(o => o.id === user.organizationId);
                return (
                  <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    
                    {/* Employee ID */}
                    <td className="px-6 py-4 font-mono font-bold text-[10px]">
                      {user.employeeId || "N/A"}
                    </td>

                    {/* Name / Username */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-800 dark:text-slate-200 border flex items-center justify-center">
                          {user.username?.[0].toUpperCase() || "S"}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800 dark:text-slate-200">{user.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold">@{user.username}</p>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Organization */}
                    <td className="px-6 py-4">
                      {org ? (
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-300">{org.name}</p>
                          <p className="text-[10px] font-mono text-slate-400">Code: {org.code}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No Organization</span>
                      )}
                    </td>

                    {/* Approval Status Badge */}
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        user.userApprovalStatus === "PENDING"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/30"
                          : user.userApprovalStatus === "APPROVED"
                          ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-200/30"
                          : user.userApprovalStatus === "REJECTED"
                          ? "bg-rose-50 text-rose-700 dark:bg-rose-955/20 dark:text-rose-450 border border-rose-200/30"
                          : user.userApprovalStatus === "RETURNED"
                          ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/30"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}>
                        {user.userApprovalStatus || "DRAFT"}
                      </span>
                    </td>

                    {/* Remarks */}
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={user.remarks || ""}>
                      {user.remarks || <span className="italic text-slate-350">No remarks</span>}
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 text-slate-400 font-medium">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit Action (allowed only for Draft, Rejected, Returned) */}
                        {user.userApprovalStatus !== "APPROVED" && (
                          <button
                            title="Edit Record"
                            onClick={() => handleEdit(user)}
                            className="p-1.5 bg-white dark:bg-slate-800 hover:text-indigo-600 hover:border-indigo-650/30 border dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Clone Action */}
                        <button
                          title="Clone Record"
                          onClick={() => handleClone(user)}
                          className="p-1.5 bg-white dark:bg-slate-800 hover:text-indigo-600 hover:border-indigo-650/30 border dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Resubmit Action (allowed for Draft, Rejected, Returned) */}
                        {user.userApprovalStatus !== "APPROVED" && user.userApprovalStatus !== "PENDING" && (
                          <button
                            title="Resubmit Record"
                            onClick={() => handleResubmit(user)}
                            className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          </button>
                        )}

                        {/* Delete Action */}
                        <button
                          title="Delete Record"
                          onClick={() => handleDelete(user.id, user.username || "")}
                          className="p-1.5 bg-white dark:bg-slate-800 hover:text-rose-600 border dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}

              {getRecordsByTab().length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold">
                    No {activeTab.toLowerCase()} Super Admin records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
