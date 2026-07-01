"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Memo {
  id: number;
  user_id: number;
  title: string;
  content: string;
  created_at: string;
}

export default function MemosPage() {
  const router = useRouter();

  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);

  // 新增表单
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [adding, setAdding] = useState(false);

  // 加载自己的备忘录
  async function fetchMemos() {
    setLoading(true);
    try {
      const res = await fetch("/api/memos");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      setMemos(json.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMemos();
  }, []);

  async function addMemo() {
    if (!title.trim()) return;
    setAdding(true);
    await fetch("/api/memos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), content: content.trim() }),
    });
    setTitle("");
    setContent("");
    setAdding(false);
    fetchMemos();
  }

  async function deleteMemo(id: number) {
    await fetch(`/api/memos/${id}`, { method: "DELETE" });
    fetchMemos();
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-bold text-black">个人备忘录</h1>
          <a href="/dashboard" className="text-sm text-zinc-500 hover:text-black">
            返回 Dashboard
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* 新增表单 */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="font-bold text-black">新增备忘录</h2>
          <div className="mt-3 space-y-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="标题"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="内容（可选）"
              rows={3}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-black focus:outline-none"
            />
            <Button onClick={addMemo} disabled={adding || !title.trim()}>
              {adding ? "添加中..." : "添加备忘录"}
            </Button>
          </div>
        </div>

        {/* 备忘录列表 */}
        <div className="mt-6">
          {loading ? (
            <p className="text-center text-sm text-zinc-400">加载中...</p>
          ) : memos.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 py-16 text-center text-sm text-zinc-400">
              还没有备忘录，在上方添加一个吧
            </div>
          ) : (
            <div className="space-y-3">
              {memos.map((memo) => (
                <div
                  key={memo.id}
                  className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <a
                        href={`/memos/${memo.id}`}
                        className="font-semibold text-black hover:text-indigo-600 transition-colors"
                      >
                        {memo.title}
                      </a>
                      {memo.content && (
                        <p className="mt-1 text-sm text-zinc-500 whitespace-pre-wrap">
                          {memo.content}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-zinc-400">
                        {new Date(memo.created_at).toLocaleString("zh-CN")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => deleteMemo(memo.id)}
                      className="text-zinc-400 hover:text-red-500 shrink-0"
                    >
                      删除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
