"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface SearchResult {
  id: string;
  title: string;
  type: "memo" | "knowledge" | "content" | "lead";
  typeLabel: string;
  href: string;
}

export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // ⌘K / Ctrl+K 快捷键
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  // 搜索逻辑
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await fetch("/api/search?q=" + encodeURIComponent(query));
      const json = await res.json();
      setResults(json.data || []);
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  function onSelect(item: SearchResult) {
    setOpen(false);
    setQuery("");
    router.push(item.href);
  }

  const typeColors: Record<string, string> = {
    memo: "bg-blue-100 text-blue-700",
    knowledge: "bg-green-100 text-green-700",
    content: "bg-purple-100 text-purple-700",
    lead: "bg-amber-100 text-amber-700",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <div className="flex items-center border-b border-zinc-200 px-4">
          <span className="text-zinc-400 text-sm">🔍</span>
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索备忘录、知识库、内容、线索..."
            className="border-0 shadow-none focus-visible:ring-0 text-sm h-12"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-400 font-mono">
            ⌘K
          </kbd>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-sm text-zinc-400">搜索中...</div>
          ) : query && results.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-400">无搜索结果</div>
          ) : results.length > 0 ? (
            results.map((item) => (
              <button
                key={item.type + item.id}
                onClick={() => onSelect(item)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 transition-colors"
              >
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${typeColors[item.type]}`}>
                  {item.typeLabel}
                </span>
                <span className="text-sm text-zinc-700 truncate">{item.title}</span>
              </button>
            ))
          ) : (
            <div className="py-12 text-center text-sm text-zinc-400">
              输入关键词搜索
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
