"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Memo {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

export default function MemoDetailPage() {
  const params = useParams(); // 从 URL 中读取 [id]
  const router = useRouter();

  const [memo, setMemo] = useState<Memo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/memos/${params.id}`);
        if (!res.ok) throw new Error((await res.json()).error || "加载失败");
        const json = await res.json();
        setMemo(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "未知错误");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-zinc-400">加载中...</p>
      </div>
    );
  }

  if (error || !memo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-center">
          <p className="text-zinc-500">{error || "备忘录不存在"}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-sm text-indigo-600 hover:underline"
          >
            返回上一页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="flex items-center gap-6 border-b border-zinc-200 bg-white px-6 py-4">
        <button
          onClick={() => router.back()}
          className="text-sm text-zinc-500 hover:text-black"
        >
          ← 返回列表
        </button>
        <h1 className="text-lg font-bold text-black">{memo.title}</h1>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-xl border border-zinc-200 bg-white p-8">
          <p className="text-xs text-zinc-400">
            创建于 {new Date(memo.created_at).toLocaleString("zh-CN")}
          </p>
          <div className="mt-4 text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">
            {memo.content || "（无内容）"}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            返回列表
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              await fetch(`/api/memos/${params.id}`, { method: "DELETE" });
              router.push("/memos");
            }}
          >
            删除此备忘录
          </Button>
        </div>
      </main>
    </div>
  );
}
