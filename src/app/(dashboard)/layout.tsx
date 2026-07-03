"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "sonner";
import { Breadcrumb } from "@/components/breadcrumb";
import { SearchDialog } from "@/components/search-dialog";
import { NotificationBell } from "@/components/notification-bell";
import { PresenceIndicator } from "@/components/presence-indicator";

const navLinks = [
  { href: "/dashboard", label: "概览", icon: "📊" },
  { href: "/memos", label: "备忘录", icon: "📝" },
  { href: "/knowledge", label: "知识库", icon: "📚" },
  { href: "/content", label: "内容工坊", icon: "✍️" },
  { href: "/leads", label: "线索管理", icon: "👥" },
  { href: "/sites", label: "独立站", icon: "🌐" },
  { href: "/analytics", label: "数据分析", icon: "📈" },
  { href: "/tasks", label: "任务管理", icon: "✅" },
  { href: "/settings", label: "设置", icon: "⚙️" },
  { href: "/api-docs", label: "API 文档", icon: "🔌" },
];

function SidebarNav({ pathname, user }: { pathname: string; user: { is_platform_admin?: boolean } | null }) {
  return (
    <nav className="flex flex-col gap-1 p-4 h-full">
      <h2 className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-zinc-400">
        VertaX
      </h2>
      {navLinks.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
        return (
          <a
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
              isActive
                ? "bg-black text-white shadow-sm"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <span>{link.icon}</span>
            {link.label}
          </a>
        );
      })}
      {user?.is_platform_admin && (
        <div className="mt-auto pt-3 border-t border-zinc-100">
          <a
            href="/admin"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-500 hover:text-black hover:bg-zinc-100 transition-all duration-200"
          >
            <span>⚙️</span>
            运营后台
          </a>
        </div>
      )}
    </nav>
  );
}

function TopBar({
  user,
  onLogout,
}: {
  user: { name: string; email: string } | null;
  onLogout: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/80 backdrop-blur-sm px-6">
      <Breadcrumb />
      <div className="flex items-center gap-1">
      <PresenceIndicator user={user} />
      <NotificationBell />
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-zinc-100 transition-colors">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs text-white font-medium">
            {user?.name?.charAt(0) || "?"}
          </span>
          <span className="hidden sm:inline text-sm font-medium text-zinc-700">
            {user?.name}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-black">{user?.name}</p>
            <p className="text-xs text-zinc-400">{user?.email}</p>
          </div>
          <div className="h-px bg-zinc-100" />
          <DropdownMenuItem onClick={onLogout} className="text-red-500">
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; email: string; is_platform_admin?: boolean } | null>(null);
  const [trialExpired, setTrialExpired] = useState(false);
  const [trialWarning, setTrialWarning] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setUser(json.data);
        else router.push("/login");
      });
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((j) => {
        if (j.data) {
          if (j.data.subscription_status === "trial" && j.data.trial_ends_at) {
            const left = Math.ceil((new Date(j.data.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            if (left <= 0) setTrialExpired(true);
            else if (left <= 3) setTrialWarning(true);
          }
          if (j.data.subscription_status === "expired") setTrialExpired(true);
        }
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  // ========== 移动端 ==========
  return (
    <>
      <div className="sm:hidden min-h-screen bg-zinc-50">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
          <Sheet>
            <SheetTrigger className="inline-flex items-center justify-center rounded-md p-2 text-sm hover:bg-zinc-100">
              ☰
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarNav pathname={pathname} user={user} />
            </SheetContent>
          </Sheet>
          <h1 className="text-sm font-bold text-black">VertaX</h1>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs text-white font-medium">
              {user?.name?.charAt(0) || "?"}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-3 py-2 text-xs text-zinc-500">{user?.email}</div>
              <DropdownMenuItem onClick={handleLogout}>退出登录</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        {trialExpired && (
          <div className="bg-red-500 text-white text-center text-sm py-2 px-4">
            试用已到期，部分功能受限。
            <a href="/settings" className="underline ml-2 font-medium">立即升级</a>
          </div>
        )}
        {trialWarning && !trialExpired && (
          <div className="bg-yellow-400 text-yellow-900 text-center text-sm py-2 px-4">
            试用即将到期，请尽快升级以免影响使用。
            <a href="/settings" className="underline ml-2 font-medium">立即升级</a>
          </div>
        )}
        <main key={pathname} className="animate-page-enter">{children}</main>
      </div>

      {/* ========== 桌面端：侧边栏 + 顶栏 + 内容 ========== */}
      <div className="hidden sm:flex min-h-screen bg-zinc-50">
        <aside className="fixed left-0 top-0 flex h-screen w-56 flex-col border-r border-zinc-200 bg-white">
          <SidebarNav pathname={pathname} user={user} />
        </aside>
        <div className="ml-56 flex flex-1 flex-col">
          <TopBar user={user} onLogout={handleLogout} />
          {trialExpired && (
            <div className="bg-red-500 text-white text-center text-sm py-2 px-4">
              试用已到期，部分功能受限。
              <a href="/settings" className="underline ml-2 font-medium">立即升级</a>
            </div>
          )}
          {trialWarning && !trialExpired && (
            <div className="bg-yellow-400 text-yellow-900 text-center text-sm py-2 px-4">
              试用即将到期，请尽快升级以免影响使用。
              <a href="/settings" className="underline ml-2 font-medium">立即升级</a>
            </div>
          )}
          <main key={pathname} className="flex-1 animate-page-enter">{children}</main>
        </div>
      </div>
      <Toaster position="top-center" richColors />
      <SearchDialog />
    </>
  );
}
