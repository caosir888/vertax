"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Memo {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function MemoDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [memo, setMemo] = useState<Memo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

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

  function openEdit() {
    if (!memo) return;
    setEditTitle(memo.title);
    setEditContent(memo.content);
    setEditing(true);
  }

  async function saveEdit() {
    if (!memo || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/memos/${memo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim(), content: editContent.trim() }),
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
      } else {
        toast.success("已更新");
        setMemo({ ...memo, title: editTitle.trim(), content: editContent.trim() });
        setEditing(false);
      }
    } catch {
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <div className="border-b border-zinc-200 bg-white px-6 py-4">
          <div className="h-5 w-20 animate-pulse rounded bg-zinc-200" />
        </div>
        <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
          <div className="h-8 w-48 animate-pulse rounded bg-zinc-200" />
          <div className="rounded-xl border border-zinc-200 bg-white p-8 space-y-3">
            <div className="h-4 w-24 animate-pulse rounded bg-zinc-200" />
            <div className="h-4 w-full animate-pulse rounded bg-zinc-200" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-200" />
          </div>
        </div>
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
        {editing ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">标题</label>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">内容</label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={8}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setEditing(false)}>取消</Button>
              <Button onClick={saveEdit} disabled={saving || !editTitle.trim()}>
                {saving ? "保存中..." : "保存修改"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-zinc-200 bg-white p-8">
              <div className="flex items-start justify-between">
                <p className="text-xs text-zinc-400">
                  创建于 {new Date(memo.created_at).toLocaleString("zh-CN")}
                </p>
                <Button variant="outline" size="sm" onClick={openEdit}>编辑</Button>
              </div>
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
                  try {
                    const res = await fetch(`/api/memos/${params.id}`, { method: "DELETE" });
                    const json = await res.json();
                    if (json.error) { toast.error(json.error); return; }
                    toast.success("已删除");
                    router.push("/memos");
                  } catch {
                    toast.error("删除失败");
                  }
                }}
              >
                删除此备忘录
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
