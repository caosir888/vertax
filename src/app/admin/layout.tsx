"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Toaster } from "sonner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((json) => {
        if (!json.data) { router.push("/login"); return; }
        if (!json.data.is_platform_admin) { router.push("/dashboard"); return; }
        setAuthorized(true);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-200 bg-white">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-sm font-bold text-black">VertaX 运营后台</Link>
          <Link href="/dashboard" className="text-xs text-zinc-400 hover:text-zinc-600">← 返回前台</Link>
        </div>
      </header>
      <main>{children}</main>
      <Toaster position="top-center" richColors />
    </div>
  );
}
