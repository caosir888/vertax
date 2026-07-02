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

const navLinks = [
  { href: "/dashboard", label: "概览", icon: "📊" },
  { href: "/memos", label: "备忘录", icon: "📝" },
  { href: "/knowledge", label: "知识库", icon: "📚" },
  { href: "/content", label: "内容工坊", icon: "✍️" },
  { href: "/leads", label: "线索管理", icon: "👥" },
  { href: "/sites", label: "独立站", icon: "🌐" },
  { href: "/analytics", label: "数据分析", icon: "📈" },
  { href: "/settings", label: "设置", icon: "⚙️" },
];

function SidebarNav({ pathname }: { pathname: string }) {
  return (
    <nav className="flex flex-col gap-1 p-4">
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
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setUser(json.data);
        else router.push("/login");
      });
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
              <SidebarNav pathname={pathname} />
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
        <main key={pathname} className="animate-page-enter">{children}</main>
      </div>

      {/* ========== 桌面端：侧边栏 + 顶栏 + 内容 ========== */}
      <div className="hidden sm:flex min-h-screen bg-zinc-50">
        <aside className="fixed left-0 top-0 flex h-screen w-56 flex-col border-r border-zinc-200 bg-white">
          <SidebarNav pathname={pathname} />
        </aside>
        <div className="ml-56 flex flex-1 flex-col">
          <TopBar user={user} onLogout={handleLogout} />
          <main key={pathname} className="flex-1 animate-page-enter">{children}</main>
        </div>
      </div>
      <Toaster position="top-center" richColors />
      <SearchDialog />
    </>
  );
}
