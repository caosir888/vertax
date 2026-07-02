"use client";

import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    const res = await fetch("/api/notifications");
    const json = await res.json();
    if (json.data) {
      setNotifications(json.data);
      setUnread(json.unread || 0);
    }
  }

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnread((prev) => Math.max(0, prev - 1));
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
  }

  return (
    <DropdownMenu open={open} onOpenChange={(val) => { setOpen(val); if (val) fetchNotifications(); }}>
      <DropdownMenuTrigger className="relative inline-flex items-center justify-center rounded-lg p-2 text-sm hover:bg-zinc-100 transition-colors">
        <span className="text-zinc-500">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-sm font-medium text-black">通知</p>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <>
                <button
                  onClick={markAllRead}
                  className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  全部已读
                </button>
                <span className="text-xs text-red-500">{unread} 条未读</span>
              </>
            )}
          </div>
        </div>
        <div className="h-px bg-zinc-100" />
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400">暂无通知</div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`flex w-full flex-col gap-0.5 px-3 py-2.5 text-left hover:bg-zinc-50 transition-colors ${
                  !n.is_read ? "bg-blue-50/50" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  {!n.is_read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />}
                  <span className="text-sm text-zinc-800">{n.title}</span>
                </div>
                {n.message && (
                  <span className="text-xs text-zinc-400 line-clamp-1 ml-3.5">{n.message}</span>
                )}
                <span className="text-xs text-zinc-300 ml-3.5">
                  {new Date(n.created_at).toLocaleString("zh-CN")}
                </span>
              </button>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
