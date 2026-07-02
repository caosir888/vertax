"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";

interface Document {
  id: string;
  name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  status: string;
  created_at: string;
}

const typeLabels: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word",
  "application/msword": "Word",
  "text/plain": "TXT",
  "text/markdown": "MD",
  "text/x-markdown": "MD",
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function KnowledgePage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [delId, setDelId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadDocs(); }, []);

  async function loadDocs() {
    setLoading(true);
    try {
      const res = await fetch("/api/documents");
      const json = await res.json();
      if (json.data) setDocs(json.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  const doUpload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/documents", { method: "POST", body: formData });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
      } else {
        toast.success(`"${file.name}" 上传成功`);
        loadDocs();
      }
    } catch {
      toast.error("上传失败，请重试");
    } finally {
      setUploading(false);
    }
  }, []);

  function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) doUpload(file);
  }

  async function deleteDoc() {
    try {
      const res = await fetch(`/api/documents/${delId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.error) toast.error(json.error);
      else { toast.success("文档已删除"); loadDocs(); }
    } catch {
      toast.error("删除失败");
    }
  }

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-black">知识库</h1>
        <p className="mt-2 text-sm text-zinc-500">
          上传 PDF、Word、TXT、Markdown 文档，AI 将自动解析用于智能问答
        </p>

        {/* ========== 上传区域 ========== */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-6 cursor-pointer rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
            dragOver
              ? "border-black bg-zinc-50"
              : "border-zinc-300 hover:border-zinc-400"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md"
            className="hidden"
            onChange={onFileSelect}
          />
          {uploading ? (
            <div className="space-y-2">
              <div className="mx-auto h-2 w-48 overflow-hidden rounded-full bg-zinc-200">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-black" />
              </div>
              <p className="text-sm text-zinc-500">上传中...</p>
            </div>
          ) : (
            <>
              <div className="text-3xl">📁</div>
              <p className="mt-3 text-sm font-medium text-zinc-700">
                拖拽文件到此处，或点击上传
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                支持 PDF、Word、TXT、Markdown，最大 10MB
              </p>
            </>
          )}
        </div>

        {/* ========== 文件列表 ========== */}
        <div className="mt-8">
          <h2 className="text-sm font-medium text-zinc-500">
            已上传文档 ({docs.length})
          </h2>

          {loading ? (
            <div className="mt-3 space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-xl border border-zinc-200 bg-white p-5">
                  <Skeleton className="h-5 w-64" />
                  <Skeleton className="mt-2 h-3 w-36" />
                </div>
              ))}
            </div>
          ) : docs.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-zinc-300 bg-white py-16 text-center">
              <div className="text-2xl">📄</div>
              <p className="mt-2 text-sm text-zinc-400">还没有上传任何文档</p>
              <p className="text-xs text-zinc-300">上传文档后将自动解析并建立知识库索引</p>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4 hover:border-zinc-300 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">
                      {typeLabels[doc.file_type] || doc.file_type || "?"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-black truncate">{doc.name}</p>
                      <p className="text-xs text-zinc-400">
                        {formatSize(doc.file_size)} · {new Date(doc.created_at).toLocaleString("zh-CN")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setDelId(doc.id); setDelOpen(true); }}
                    className="shrink-0 text-xs text-zinc-400 hover:text-red-500 transition-colors ml-2"
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={delOpen}
        onOpenChange={setDelOpen}
        title="删除文档"
        description="删除后文档和解析数据将被移除，确定删除？"
        confirmLabel="删除"
        onConfirm={deleteDoc}
      />
    </div>
  );
}
