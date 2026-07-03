"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";

interface Memo {
  id: string;
  user_id: string;
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
  const [delOpen, setDelOpen] = useState(false);
  const [delId, setDelId] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editMemo, setEditMemo] = useState<Memo | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

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
    } catch {
      toast.error("加载备忘录失败");
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
    try {
      await fetch("/api/memos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });
      setTitle("");
      setContent("");
      toast.success("备忘录已添加");
      fetchMemos();
    } catch {
      toast.error("添加失败");
    } finally {
      setAdding(false);
    }
  }

  function promptDelete(id: string) {
    setDelId(id);
    setDelOpen(true);
  }

  async function deleteMemo() {
    try {
      await fetch(`/api/memos/${delId}`, { method: "DELETE" });
      toast.success("备忘录已删除");
      fetchMemos();
    } catch {
      toast.error("删除失败");
    }
  }

  function openEdit(memo: Memo) {
    setEditMemo(memo);
    setEditTitle(memo.title);
    setEditContent(memo.content);
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!editMemo || !editTitle.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/memos/${editMemo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim(), content: editContent.trim() }),
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
      } else {
        toast.success("备忘录已更新");
        setEditOpen(false);
        fetchMemos();
      }
    } catch {
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
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
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-zinc-200 bg-white p-5">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="mt-2 h-4 w-full" />
                  <Skeleton className="mt-1 h-4 w-2/3" />
                </div>
              ))}
            </div>
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
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => openEdit(memo)}
                        className="text-zinc-400 hover:text-indigo-500"
                      >
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => promptDelete(memo.id)}
                        className="text-zinc-400 hover:text-red-500"
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <ConfirmDialog
        open={delOpen}
        onOpenChange={setDelOpen}
        title="删除备忘录"
        description="删除后无法恢复，确定要删除这条备忘录吗？"
        confirmLabel="删除"
        onConfirm={deleteMemo}
      />

      {/* 编辑弹窗 */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-black">编辑备忘录</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">标题</label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">内容</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-black focus:outline-none resize-none"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditOpen(false)}>取消</Button>
              <Button onClick={saveEdit} disabled={saving || !editTitle.trim()}>
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
