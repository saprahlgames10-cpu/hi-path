"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import { formatTimeAgo } from "@/lib/utils";
import { Menu } from "lucide-react";
import type { Notification } from "@/types";

export function Header() {
  const { user, setSidebarOpen } = useStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) {
        setNotifications(data as Notification[]);
        setUnreadCount(data.filter((n: any) => !n.read).length);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-[26px] font-bold mb-1">
          Welcome back, <span className="text-[#6366f1]">{user?.full_name?.split(" ")[0] || "Arjun"}</span>!
        </h1>
        <p className="text-sm text-[#64748b]">
          Let&apos;s continue your journey to become a <span className="text-[#6366f1] font-medium">Python Developer</span>.
        </p>
      </div>
      <div className="flex items-center gap-5">
        <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-[#64748b]">
          <Menu className="h-6 w-6" />
        </button>
        <div className="relative hidden md:block w-[280px]">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b] text-sm" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full py-2.5 pl-10 pr-4 rounded-full border border-[#e2e8f0] text-sm outline-none bg-white"
          />
        </div>
        <div className="relative cursor-pointer text-[#64748b]" onClick={() => setShowNotifs(!showNotifs)}>
          <i className="fa-regular fa-bell text-xl" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#ef4444] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          {showNotifs && (
            <div className="absolute right-0 top-8 w-80 bg-white border border-[#e2e8f0] rounded-xl shadow-lg z-50 max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-[#64748b]">No notifications yet</div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`p-3 border-b border-[#e2e8f0] text-sm ${!n.read ? "bg-[#f8fafc]" : ""}`}>
                    <p className="font-medium">{n.title}</p>
                    <p className="text-xs text-[#64748b] mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-[#64748b] mt-1">{formatTimeAgo(n.created_at)}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 cursor-pointer">
          <img
            src={user?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
            alt="Avatar"
            className="w-[38px] h-[38px] rounded-full object-cover"
          />
          <i className="fa-solid fa-chevron-down text-xs text-[#64748b]" />
        </div>
      </div>
    </header>
  );
}
