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

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  ready: { label: "待解析", color: "bg-zinc-100 text-zinc-600" },
  processing: { label: "解析中", color: "bg-blue-100 text-blue-700" },
  done: { label: "已解析", color: "bg-green-100 text-green-700" },
  error: { label: "失败", color: "bg-red-100 text-red-700" },
};

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
  const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
  const [selectedKbId, setSelectedKbId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [delId, setDelId] = useState("");
  const [kbOpen, setKbOpen] = useState(false);
  const [kbForm, setKbForm] = useState({ name: "", description: "" });
  const [kbDelOpen, setKbDelOpen] = useState(false);
  const [kbDelId, setKbDelId] = useState("");
  const [renamingKbId, setRenamingKbId] = useState("");
  const [renamingName, setRenamingName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadKbs(); }, []);

  useEffect(() => {
    if (kbs.length > 0 && !selectedKbId) {
      setSelectedKbId(kbs[0].id);
    }
  }, [kbs]);

  useEffect(() => { loadDocs(); }, [selectedKbId]);

  async function loadKbs() {
    try {
      const res = await fetch("/api/knowledge-bases");
      const json = await res.json();
      if (json.data) setKbs(json.data);
    } catch { /* ignore */ }
  }

  async function loadDocs() {
    setLoading(true);
    try {
      let url = "/api/documents";
      if (selectedKbId) url += `?knowledge_base_id=${selectedKbId}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.data) setDocs(json.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  const doUpload = useCallback(async (file: File) => {
    if (!selectedKbId) {
      toast.error("请先选择或创建一个知识库");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("knowledge_base_id", selectedKbId);
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
  }, [selectedKbId]);

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

  async function parseDoc(docId: string) {
    toast.info("开始解析文档...");
    try {
      const res = await fetch(`/api/documents/${docId}/parse`, { method: "POST" });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
      } else {
        toast.success(`解析完成！共 ${json.data.chunk_count} 个文本块`);
        loadDocs();
      }
    } catch {
      toast.error("解析失败");
    }
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

  async function embedDoc(docId: string) {
    toast.info("正在向量化...");
    try {
      const res = await fetch(`/api/documents/${docId}/embed`, { method: "POST" });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
      } else {
        toast.success(`向量化完成！${json.data.chunk_count} 个分块，${json.data.dimensions} 维`);
      }
    } catch {
      toast.error("向量化失败");
    }
  }

  async function createKb() {
    if (!kbForm.name.trim()) {
      toast.error("请输入知识库名称");
      return;
    }
    try {
      const res = await fetch("/api/knowledge-bases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kbForm),
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
      } else {
        toast.success("知识库创建成功");
        setKbForm({ name: "", description: "" });
        setKbOpen(false);
        loadKbs();
        setSelectedKbId(json.data.id);
      }
    } catch {
      toast.error("创建失败");
    }
  }

  async function deleteKb(kbId: string) {
    try {
      const res = await fetch(`/api/knowledge-bases/${kbId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.error) toast.error(json.error);
      else {
        toast.success("知识库已删除");
        if (selectedKbId === kbId) setSelectedKbId("");
        loadKbs();
      }
    } catch {
      toast.error("删除失败");
    }
  }

  async function renameKb(kbId: string, newName: string) {
    if (!newName.trim()) return;
    try {
      await fetch(`/api/knowledge-bases/${kbId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      toast.success("已重命名");
      loadKbs();
    } catch {
      toast.error("重命名失败");
    }
  }

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        {/* 顶部：标题 + 知识库选择 */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-black">知识库</h1>
            <p className="mt-1 text-sm text-zinc-500">
              上传文档，AI 自动解析并向量化用于智能问答
            </p>
          </div>
          <a
            href="/knowledge/chat"
            className="shrink-0 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
          >
            AI 问答
          </a>
        </div>

        {/* 知识库选择器 */}
        <div className="mt-6 flex items-center gap-3 flex-wrap">
          <span className="text-sm text-zinc-500">当前知识库：</span>
          {kbs.length === 0 ? (
            <p className="text-sm text-zinc-400">暂无知识库，请先创建</p>
          ) : (
            <select
              value={selectedKbId}
              onChange={(e) => setSelectedKbId(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:border-black focus:outline-none"
            >
              {kbs.map((kb) => (
                <option key={kb.id} value={kb.id}>{kb.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => { setKbForm({ name: "", description: "" }); setKbOpen(true); }}
            className="text-sm text-indigo-500 hover:text-indigo-700 transition-colors"
          >
            + 新建
          </button>
          {kbs.length > 0 && (
            <div className="flex items-center gap-1 text-sm text-zinc-400">
              {renamingKbId ? (
                <div className="flex items-center gap-1">
                  <input
                    value={renamingName}
                    onChange={(e) => setRenamingName(e.target.value)}
                    className="w-32 rounded border border-zinc-300 px-2 py-0.5 text-xs focus:border-black focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { renameKb(renamingKbId, renamingName); setRenamingKbId(""); }
                      if (e.key === "Escape") setRenamingKbId("");
                    }}
                  />
                  <button onClick={() => { renameKb(renamingKbId, renamingName); setRenamingKbId(""); }} className="text-indigo-500">✓</button>
                  <button onClick={() => setRenamingKbId("")} className="text-zinc-400">✗</button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => {
                      const kb = kbs.find((k) => k.id === selectedKbId);
                      if (kb) { setRenamingKbId(kb.id); setRenamingName(kb.name); }
                    }}
                    className="hover:text-indigo-500 transition-colors"
                  >
                    重命名
                  </button>
                  <span>·</span>
                  <button
                    onClick={() => { setKbDelId(selectedKbId); setKbDelOpen(true); }}
                    className="hover:text-red-500 transition-colors"
                  >
                    删除
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* ========== 上传区域 ========== */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-4 cursor-pointer rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
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
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-black truncate">{doc.name}</p>
                        <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs ${statusLabels[doc.status]?.color || "bg-zinc-100 text-zinc-600"}`}>
                          {statusLabels[doc.status]?.label || doc.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        {formatSize(doc.file_size)} · {new Date(doc.created_at).toLocaleString("zh-CN")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {(doc.status === "ready" || doc.status === "error") && (
                      <button
                        onClick={() => parseDoc(doc.id)}
                        className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
                      >
                        解析
                      </button>
                    )}
                    {doc.status === "done" && (
                      <button
                        onClick={() => embedDoc(doc.id)}
                        className="text-xs text-emerald-500 hover:text-emerald-700 transition-colors"
                      >
                        向量化
                      </button>
                    )}
                    <button
                      onClick={() => { setDelId(doc.id); setDelOpen(true); }}
                      className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      删除
                    </button>
                  </div>
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

      <ConfirmDialog
        open={kbDelOpen}
        onOpenChange={setKbDelOpen}
        title="删除知识库"
        description="删除知识库后，其中的文档不会被删除（仅移除关联）。确定删除？"
        confirmLabel="删除"
        onConfirm={() => { deleteKb(kbDelId); }}
      />

      {/* 新建知识库对话框 */}
      {kbOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-black">新建知识库</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">名称</label>
                <input
                  value={kbForm.name}
                  onChange={(e) => setKbForm({ ...kbForm, name: e.target.value })}
                  placeholder="如：产品知识库"
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  onKeyDown={(e) => e.key === "Enter" && createKb()}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">描述（可选）</label>
                <input
                  value={kbForm.description}
                  onChange={(e) => setKbForm({ ...kbForm, description: e.target.value })}
                  placeholder="简要描述知识库用途"
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  onKeyDown={(e) => e.key === "Enter" && createKb()}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setKbOpen(false)}>取消</Button>
              <Button onClick={createKb}>创建</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
