"use client";

import { useState, useEffect } from "react";
import type { ContentComment } from "@/types";
import { toast } from "sonner";

export function ContentComments({ contentId }: { contentId: string }) {
  const [comments, setComments] = useState<ContentComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadComments();
  }, [contentId]);

  async function loadComments() {
    setLoading(true);
    try {
      const res = await fetch(`/api/content/${contentId}/comments`);
      const json = await res.json();
      if (json.data) setComments(json.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/content/${contentId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
        return;
      }
      setComments((prev) => [...prev, json.data]);
      setBody("");
    } catch {
      toast.error("发送失败");
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(commentId: string) {
    try {
      const res = await fetch(`/api/content/${contentId}/comments/${commentId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
        return;
      }
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      toast.error("删除失败");
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="text-sm font-medium text-black mb-4">评论 ({comments.length})</div>

      {/* 评论列表 */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="h-7 w-7 rounded-full bg-zinc-200" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-16 bg-zinc-200 rounded" />
                  <div className="h-4 w-full bg-zinc-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-8">暂无评论，来说点什么吧</p>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3 group">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-xs text-white font-medium">
                  {c.user_name?.charAt(0) || "?"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-700">{c.user_name}</span>
                    <span className="text-xs text-zinc-300">
                      {new Date(c.created_at).toLocaleString("zh-CN")}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 mt-0.5">{c.body}</p>
                </div>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="shrink-0 text-xs text-zinc-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  title="删除评论"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 发送评论 */}
      <div className="border-t border-zinc-200 pt-3 mt-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="输入评论..."
            className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-black transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!body.trim() || sending}
            className="shrink-0 rounded-lg bg-black px-4 py-2 text-xs text-white font-medium hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? "发送中" : "发送"}
          </button>
        </div>
      </div>
    </div>
  );
}
