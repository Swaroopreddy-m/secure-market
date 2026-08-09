"use client";

import { useState } from "react";
import { Bell, CheckCheck, Inbox, AlertTriangle, ShieldCheck } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: "INFO" | "WARNING" | "SUCCESS";
}

export default function MerchantNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Product Approved",
      message: "Your request to register 'Farm Fresh Tomatoes' was APPROVED by Product Admin reviewer.",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toLocaleString(),
      read: false,
      type: "SUCCESS"
    },
    {
      id: "2",
      title: "Pricing Submission Pending",
      message: "Pricing batch configuration submitted. Awaiting Checker approval.",
      timestamp: new Date(Date.now() - 24 * 60 * 65 * 1000).toLocaleString(),
      read: true,
      type: "INFO"
    },
    {
      id: "3",
      title: "Low Stock Warning Alert",
      message: "Safety notice: 'Organic Spinach' available quantity is below minimum threshold (10 units left).",
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toLocaleString(),
      read: false,
      type: "WARNING"
    }
  ]);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
      case "WARNING":
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 p-6">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Notification Alerts</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Keep track of approvals, catalog alerts, and configuration adjustments.
          </p>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="flex items-center gap-1 text-xs font-bold text-indigo-650 hover:text-indigo-750 dark:text-indigo-400"
        >
          <CheckCheck className="w-4 h-4" /> Mark all as read
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm space-y-4">
        {notifications.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-4">
            {notifications.map(n => (
              <div key={n.id} className={`flex items-start gap-4 pt-4 first:pt-0 ${n.read ? "opacity-60" : ""}`}>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">{n.title}</h4>
                    <span className="text-[10px] font-semibold text-slate-400">{n.timestamp}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <Inbox className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-bold">No active notifications found.</p>
          </div>
        )}
      </div>

    </div>
  );
}
