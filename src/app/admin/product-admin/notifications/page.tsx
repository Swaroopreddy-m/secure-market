"use client";

import { useState, useEffect } from "react";
import { 
  Bell, Check, Loader2, AlertCircle, Trash2, MailOpen
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifs = async () => {
    try {
      const res = await fetch("/api/product-admin/notifications");
      if (!res.ok) throw new Error("Failed to load notifications inbox.");
      const data = await res.json();
      setNotifications(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/product-admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      const res = await fetch("/api/product-admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 p-6 max-w-xl mx-auto">
      
      {/* Title */}
      <div className="flex justify-between items-center border-b pb-4 border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-500" />
          <h2 className="text-xl font-black text-slate-850 dark:text-slate-100">Notifications Inbox</h2>
        </div>
        {notifications.some(n => !n.read) && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-650 hover:underline cursor-pointer"
          >
            <MailOpen className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-750 p-4 rounded-2xl text-xs font-bold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Notifications stack */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-650" />
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.read && handleMarkOneRead(n.id)}
              className={`p-4 rounded-3xl border transition-all flex justify-between items-start gap-4 ${
                n.read 
                  ? "bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/50 opacity-80" 
                  : "bg-indigo-50/15 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900/30 cursor-pointer hover:border-indigo-300"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{n.title}</h4>
                </div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-450 leading-relaxed">{n.message}</p>
              </div>
              <span className="text-[9px] text-slate-400 font-mono flex-shrink-0">
                {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-3xl text-center text-slate-400 font-bold border">
            Your notification inbox is clean.
          </div>
        )}
      </div>

    </div>
  );
}
