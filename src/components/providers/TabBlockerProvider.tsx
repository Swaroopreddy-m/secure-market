"use client";

import { useEffect, useState, useRef } from "react";
import { Lock, Sparkles, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TabBlockerProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const tabIdRef = useRef<string>("");
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    // Unique ID for this tab instance
    tabIdRef.current = Math.random().toString(36).substring(2, 11);
    
    // Setup BroadcastChannel
    const channel = new BroadcastChannel("secure_market_tabs");
    channelRef.current = channel;

    // Send ping to notify other tabs
    channel.postMessage({ type: "TAB_OPENED", id: tabIdRef.current });

    const handleMessage = (event: MessageEvent) => {
      const { type, id } = event.data;

      if (type === "TAB_OPENED" && id !== tabIdRef.current) {
        // Another tab opened, send response that we are alive
        channel.postMessage({ type: "TAB_ALIVE", id: tabIdRef.current });
      }

      if (type === "TAB_ALIVE" && id !== tabIdRef.current) {
        // We received a response from an existing active tab, so we lock ourselves
        setIsLocked(true);
      }

      if (type === "TAKEOVER" && id !== tabIdRef.current) {
        // Another tab has taken over, so this tab must lock
        setIsLocked(true);
      }
    };

    channel.addEventListener("message", handleMessage);

    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
    };
  }, []);

  const handleTakeover = () => {
    if (channelRef.current) {
      // Broadcast takeover event to lock other tabs
      channelRef.current.postMessage({ type: "TAKEOVER", id: tabIdRef.current });
      setIsLocked(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isLocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none"
          >
            <div className="max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-2xl flex flex-col items-center">
              <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center text-2xl animate-pulse">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-lg text-slate-100 tracking-tight">Session Locked</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Secure Market has detected another active tab editing this session. To prevent concurrent modifications and save collisons, this tab is locked.
                </p>
              </div>
              
              <button
                onClick={handleTakeover}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4" /> Use This Tab Instead
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!isLocked && children}
    </>
  );
}
