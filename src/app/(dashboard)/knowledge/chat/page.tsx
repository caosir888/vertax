"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Source {
  document_id: string;
  document_name: string;
  chunk_index: number;
  content: string;
  similarity: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  time: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const q = input.trim();
    if (!q || loading) return;

    setInput("");
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: q,
      time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, topK: 5 }),
      });
      const json = await res.json();

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: json.data?.answer || json.error || "回答失败",
        sources: json.data?.sources || [],
        time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      toast.error("问答请求失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* 顶部标题栏 */}
      <div className="shrink-0 border-b border-zinc-200 px-6 py-4">
        <h1 className="text-lg font-bold text-black">知识库问答</h1>
        <p className="text-xs text-zinc-500">基于已上传的文档内容，AI 自动检索并回答</p>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="text-4xl">🤖</div>
              <p className="mt-4 text-sm font-medium text-zinc-700">开始知识库问答</p>
              <p className="mt-1 text-xs text-zinc-400">
                提问"这家公司是做什么的"或"产品有哪些优势"试试
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                    msg.role === "user"
                      ? "bg-black text-white"
                      : "bg-zinc-100 text-zinc-800"
                  }`}
                >
                  {/* 消息内容 */}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>

                  {/* 来源引用 */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 border-t border-zinc-200/50 pt-3">
                      <p className="text-xs font-medium text-zinc-500">参考来源：</p>
                      <div className="mt-1.5 space-y-1">
                        {msg.sources.map((s, i) => (
                          <details key={i} className="text-xs text-zinc-500">
                            <summary className="cursor-pointer hover:text-zinc-700 transition-colors">
                              [{i + 1}] {s.document_name} · 分块 {s.chunk_index + 1}
                              <span className="ml-2 text-zinc-400">
                                (相关度: {(s.similarity * 100).toFixed(0)}%)
                              </span>
                            </summary>
                            <p className="mt-1 pl-4 text-zinc-400 leading-relaxed line-clamp-3">
                              {s.content}
                            </p>
                          </details>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 时间 */}
                  <p
                    className={`mt-2 text-xs ${
                      msg.role === "user" ? "text-white/50" : "text-zinc-400"
                    }`}
                  >
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}

            {/* 加载中 */}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-zinc-100 px-5 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* 输入框 */}
      <div className="shrink-0 border-t border-zinc-200 bg-white px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-2xl gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="输入问题，按 Enter 发送..."
            rows={1}
            disabled={loading}
            className="flex-1 resize-none rounded-xl border border-zinc-300 px-4 py-2.5 text-sm placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black disabled:opacity-50"
          />
          <Button
            onClick={send}
            disabled={loading || !input.trim()}
            className="shrink-0 rounded-xl bg-black px-5 text-white hover:bg-zinc-800"
          >
            发送
          </Button>
        </div>
      </div>
    </div>
  );
}
