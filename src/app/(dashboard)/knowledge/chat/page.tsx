"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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

interface ChatSession {
  id: string;
  title: string;
  knowledge_base_id: string | null;
  created_at: string;
  messages?: Message[];
}

interface KnowledgeBase {
  id: string;
  name: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
  const [selectedKbId, setSelectedKbId] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { loadSessions(); loadKbs(); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadKbs() {
    try {
      const res = await fetch("/api/knowledge-bases");
      const json = await res.json();
      if (json.data) setKbs(json.data);
    } catch { /* ignore */ }
  }

  async function loadSessions() {
    try {
      const res = await fetch("/api/chats");
      const json = await res.json();
      if (json.data) setSessions(json.data);
    } catch { /* ignore */ }
  }

  async function selectSession(id: string) {
    try {
      const res = await fetch(`/api/chats/${id}`);
      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
        return;
      }
      const s = json.data;
      setSessionId(s.id);
      setSelectedKbId(s.knowledge_base_id || "");
      setMessages(
        (s.messages || []).map((m: { id: string; role: string; content: string; sources?: Source[]; created_at: string }) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          sources: m.sources,
          time: new Date(m.created_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
        }))
      );
    } catch {
      toast.error("加载会话失败");
    }
  }

  async function deleteSession(id: string) {
    try {
      await fetch(`/api/chats/${id}`, { method: "DELETE" });
      toast.success("会话已删除");
      if (sessionId === id) { newSession(); }
      loadSessions();
    } catch {
      toast.error("删除失败");
    }
  }

  function newSession() {
    setSessionId("");
    setMessages([]);
    setInput("");
  }

  const send = useCallback(async () => {
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
        body: JSON.stringify({
          question: q,
          topK: 5,
          session_id: sessionId || undefined,
          knowledge_base_id: selectedKbId || undefined,
        }),
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

      // 如果是新会话，保存 session_id 并刷新列表
      if (!sessionId && json.data?.session_id) {
        setSessionId(json.data.session_id);
        loadSessions();
      }
    } catch {
      toast.error("问答请求失败，请重试");
    } finally {
      setLoading(false);
    }
  }, [input, loading, sessionId, selectedKbId]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* 侧边栏：历史会话 */}
      <div className={`${sidebarOpen ? "w-64" : "w-0"} shrink-0 border-r border-zinc-200 bg-zinc-50/50 overflow-hidden transition-all`}>
        <div className="flex h-full flex-col">
          <div className="px-4 py-3 border-b border-zinc-200">
            <Button
              onClick={newSession}
              className="w-full rounded-xl bg-black text-sm text-white hover:bg-zinc-800"
            >
              + 新对话
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => selectSession(s.id)}
                className={`group flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                  s.id === sessionId ? "bg-zinc-200" : "hover:bg-zinc-100"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm text-zinc-700 truncate">{s.title}</p>
                  <p className="text-xs text-zinc-400">
                    {new Date(s.created_at).toLocaleDateString("zh-CN")}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                  className="shrink-0 text-xs text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 主聊天区域 */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* 顶部 */}
        <div className="shrink-0 border-b border-zinc-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              {sidebarOpen ? "◀" : "▶"}
            </button>
            <h1 className="text-lg font-bold text-black">知识库问答</h1>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedKbId}
              onChange={(e) => setSelectedKbId(e.target.value)}
              className="rounded-lg border border-zinc-300 px-2 py-1 text-xs focus:border-black focus:outline-none"
            >
              <option value="">全部知识库</option>
              {kbs.map((kb) => (
                <option key={kb.id} value={kb.id}>{kb.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="text-4xl">🤖</div>
                <p className="mt-4 text-sm font-medium text-zinc-700">开始知识库问答</p>
                <p className="mt-1 text-xs text-zinc-400">
                  输入问题，AI 将基于知识库内容回答
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
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>

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
    </div>
  );
}
