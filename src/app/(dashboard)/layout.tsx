"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { href: "/dashboard", label: "概览", icon: "📊" },
  { href: "/memos", label: "备忘录", icon: "📝" },
  { href: "/knowledge", label: "知识库", icon: "📚" },
  { href: "/content", label: "内容工坊", icon: "✍️" },
  { href: "/leads", label: "线索管理", icon: "👥" },
  { href: "/analytics", label: "数据分析", icon: "📈" },
  { href: "/settings", label: "设置", icon: "⚙️" },
];

function SidebarNav({ pathname }: { pathname: string }) {
  return (
    <nav className="flex flex-col gap-1 p-4">
      <h2 className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-zinc-400">
        VertaX
      </h2>
      {navLinks.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            pathname.startsWith(link.href)
              ? "bg-black text-white"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          <span>{link.icon}</span>
          {link.label}
        </a>
      ))}
    </nav>
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

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* 移动端顶栏 */}
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 sm:hidden">
        <Sheet>
          <SheetTrigger className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium hover:bg-zinc-100">
            ☰
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarNav pathname={pathname} />
          </SheetContent>
        </Sheet>
        <h1 className="text-sm font-bold text-black">VertaX</h1>
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium hover:bg-zinc-100">
            👤
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-3 py-2 text-xs text-zinc-500">{user?.email}</div>
            <DropdownMenuItem onClick={handleLogout}>退出登录</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* 桌面端侧边栏 */}
      <div className="hidden sm:flex">
        <aside className="fixed left-0 top-0 flex h-screen w-56 flex-col border-r border-zinc-200 bg-white">
          <SidebarNav pathname={pathname} />
          <div className="mt-auto border-t border-zinc-200 p-4">
            <p className="text-sm font-medium text-black">{user?.name}</p>
            <p className="text-xs text-zinc-400">{user?.email}</p>
            <button onClick={handleLogout} className="mt-2 text-xs text-zinc-400 hover:text-red-500">
              退出登录
            </button>
          </div>
        </aside>
        <main className="ml-56 flex-1">{children}</main>
      </div>

      {/* 移动端内容 */}
      <main className="sm:hidden">{children}</main>
    </div>
  );
}
