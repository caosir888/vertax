"use client";

import { useState, useEffect, useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PresenceUser {
  id: string;
  user_id: string;
  user_name: string;
  current_page: string;
  last_seen_at: string;
}

export function PresenceIndicator({ user }: { user: { name: string } | null }) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [open, setOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    heartbeat();
    fetchPresence();
    intervalRef.current = setInterval(() => {
      heartbeat();
      fetchPresence();
    }, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  async function heartbeat() {
    try {
      await fetch("/api/presence/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_page: window.location.pathname }),
      });
    } catch {
      /* 心跳静默失败 */
    }
  }

  async function fetchPresence() {
    try {
      const res = await fetch("/api/team/presence");
      const json = await res.json();
      if (json.data) setOnlineUsers(json.data);
    } catch {
      /* 静默失败 */
    }
  }

  const otherOnline = onlineUsers.filter((u) => u.user_name !== user?.name);

  return (
    <DropdownMenu open={open} onOpenChange={(val) => { setOpen(val); if (val) fetchPresence(); }}>
      <DropdownMenuTrigger className="relative inline-flex items-center justify-center rounded-lg p-2 text-sm hover:bg-zinc-100 transition-colors">
        <span className="text-zinc-500">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
          </svg>
        </span>
        {otherOnline.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-green-500 px-1 text-[10px] font-bold text-white">
            {otherOnline.length > 9 ? "9+" : otherOnline.length}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-sm font-medium text-black">在线成员</p>
          <span className="text-xs text-zinc-400">{onlineUsers.length} 人在线</span>
        </div>
        <div className="h-px bg-zinc-100" />
        {onlineUsers.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400">暂无在线成员</div>
        ) : (
          <div className="max-h-48 overflow-y-auto">
            {onlineUsers.map((u) => (
              <div
                key={u.user_id}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-xs text-white font-medium">
                  {u.user_name?.charAt(0) || "?"}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-zinc-800 truncate">
                    {u.user_name}
                    {u.user_name === user?.name ? "（你）" : ""}
                  </span>
                  <span className="text-xs text-zinc-400">在线</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
