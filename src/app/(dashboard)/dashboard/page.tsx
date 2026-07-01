"use client";

import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [user, setUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setUser(json.data);
      });
  }, []);

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-black">
          欢迎回来，{user?.name || "..."}！
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          VertaX AI 驱动的 B2B 获客平台
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "知识库文档", value: "0", href: "/knowledge" },
            { label: "AI 生成内容", value: "0", href: "/content" },
            { label: "线索数量", value: "0", href: "/leads" },
          ].map((card) => (
            <a
              key={card.label}
              href={card.href}
              className="rounded-lg border border-zinc-200 bg-white p-6 text-center hover:border-zinc-300 transition-colors"
            >
              <div className="text-3xl font-bold text-black">{card.value}</div>
              <div className="mt-1 text-sm text-zinc-500">{card.label}</div>
            </a>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-400">
          左侧导航各模块（知识库 / 内容工坊 / 线索管理 / 数据分析 / 设置）
          <br />
          将在后续课程中逐一实现
        </div>
      </div>
    </div>
  );
}
