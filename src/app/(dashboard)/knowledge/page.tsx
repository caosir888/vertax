"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/* ========== 类型 ========== */

interface Document {
  id: string;
  name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  status: string;
  source_url: string;
  content_text: string;
  chunk_count: number;
  original_filename: string;
  created_at: string;
}

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

/* ========== 常量 ========== */

const STATUS_TABS = [
  { key: "", label: "全部" },
  { key: "done", label: "已就绪" },
  { key: "processing", label: "处理中" },
  { key: "ready", label: "未处理" },
  { key: "failed", label: "失败" },
];

const STATUS_LABELS: Record<string, string> = {
  ready: "未处理",
  processing: "处理中",
  done: "已就绪",
  error: "失败",
  failed: "失败",
};

const STATUS_COLORS: Record<string, string> = {
  ready: "bg-zinc-100 text-zinc-600",
  processing: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-600",
  failed: "bg-red-100 text-red-600",
};

const TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word",
  "application/msword": "Word",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPT",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel",
  "text/plain": "TXT",
  "text/markdown": "MD",
  "text/x-markdown": "MD",
  "webpage": "网页",
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatTime(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/* ========== 主页面 ========== */

export default function KnowledgePage() {
  const [activeTab, setActiveTab] = useState<"upload" | "fetch">("upload");
  const [docs, setDocs] = useState<Document[]>([]);
  const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
  const [selectedKbId, setSelectedKbId] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 弹窗状态
  const [kbOpen, setKbOpen] = useState(false);
  const [kbForm, setKbForm] = useState({ name: "", description: "" });
  const [showText, setShowText] = useState<Document | null>(null);
  const [fetchUrl, setFetchUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [renamingKbId, setRenamingKbId] = useState("");
  const [renamingName, setRenamingName] = useState("");

  useEffect(() => { loadKbs(); }, []);
  useEffect(() => { if (kbs.length > 0 && !selectedKbId) setSelectedKbId(kbs[0].id); }, [kbs]);
  useEffect(() => { loadDocs(); }, [selectedKbId]);

  async function loadKbs() {
    try {
      const res = await fetch("/api/knowledge-bases");
      const json = await res.json();
      if (json.data) setKbs(json.data);
    } catch { toast.error("知识库加载失败"); }
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

  /* ---- 上传 ---- */
  const doUpload = useCallback(async (file: File) => {
    if (!selectedKbId) { toast.error("请先选择知识库"); return; }
    setUploading(true);
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const userRes = await fetch("/api/auth/me").then((r) => r.json());
      const teamId = userRes.data?.team_id;
      if (!teamId) { toast.error("获取团队信息失败"); return; }

      const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
      const safeName = Date.now() + (ext ? "." + ext : "");
      const filePath = `${teamId}/${safeName}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file, { contentType: file.type, upsert: false });
      if (uploadError) { toast.error("上传失败: " + uploadError.message); return; }

      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath);
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, file_url: urlData.publicUrl, file_size: file.size, file_type: file.type || ext || "", knowledge_base_id: selectedKbId }),
      });
      const json = await res.json();
      if (json.error) { toast.error(json.error); return; }
      const docId = json.data?.id;
      toast.success(`"${file.name}" 上传成功`);

      // 自动解析
      if (docId) {
        toast.info("正在自动解析文档...");
        const parseRes = await fetch(`/api/documents/${docId}/parse`, { method: "POST" });
        const parseJson = await parseRes.json();
        if (parseJson.error) {
          toast.error(`解析失败: ${parseJson.error}`);
        } else {
          toast.success(`解析完成！${parseJson.data.chunk_count} 个文本块`);
          // 自动向量化
          toast.info("正在生成向量索引...");
          const embedRes = await fetch(`/api/documents/${docId}/embed`, { method: "POST" });
          const embedJson = await embedRes.json();
          if (embedJson.error) {
            toast.error(`向量化失败: ${embedJson.error}`);
          } else {
            toast.success("向量化完成，可进行智能问答");
          }
        }
      }
      loadDocs();
    } catch { toast.error("上传失败"); }
    finally { setUploading(false); }
  }, [selectedKbId]);

  function onDrop(e: React.DragEvent) { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) doUpload(f); }

  async function parseDoc(docId: string) {
    toast.info("开始解析...");
    const res = await fetch(`/api/documents/${docId}/parse`, { method: "POST" });
    const json = await res.json();
    if (json.error) toast.error(json.error);
    else { toast.success(`解析完成！${json.data.chunk_count} 个文本块`); loadDocs(); }
  }

  async function deleteDoc(id: string) {
    if (!confirm("确定删除？")) return;
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    toast.success("已删除");
    loadDocs();
  }

  /* ---- 网站智采 ---- */
  async function handleFetchUrl() {
    if (!fetchUrl.trim()) { toast.error("请输入网址"); return; }
    if (!selectedKbId) { toast.error("请先选择知识库"); return; }
    setFetching(true);
    try {
      const res = await fetch("/api/documents/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: fetchUrl.trim(), knowledge_base_id: selectedKbId }),
      });
      const json = await res.json();
      if (json.error) { toast.error(json.error); return; }
      toast.success(`已采集：${json.data.name}`);
      setFetchUrl("");
      loadDocs();
    } catch { toast.error("采集失败"); }
    finally { setFetching(false); }
  }

  /* ---- 知识库管理 ---- */
  async function createKb() {
    if (!kbForm.name.trim()) { toast.error("请输入名称"); return; }
    const res = await fetch("/api/knowledge-bases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(kbForm) });
    const json = await res.json();
    if (json.error) toast.error(json.error);
    else { toast.success("已创建"); setKbForm({ name: "", description: "" }); setKbOpen(false); loadKbs(); setSelectedKbId(json.data.id); }
  }

  async function renameKb(kbId: string, newName: string) {
    if (!newName.trim()) return;
    await fetch(`/api/knowledge-bases/${kbId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName.trim() }) });
    toast.success("已重命名");
    loadKbs();
  }

  async function deleteKb(kbId: string) {
    if (!confirm("确定删除此知识库？")) return;
    await fetch(`/api/knowledge-bases/${kbId}`, { method: "DELETE" });
    toast.success("已删除");
    if (selectedKbId === kbId) setSelectedKbId("");
    loadKbs();
  }

  /* ---- 数据筛选 ---- */
  let filteredDocs = docs;
  if (statusFilter) {
    filteredDocs = filteredDocs.filter((d) => {
      if (statusFilter === "failed") return d.status === "error" || d.status === "failed";
      return d.status === statusFilter;
    });
  }
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    filteredDocs = filteredDocs.filter((d) => d.name.toLowerCase().includes(q) || d.source_url?.toLowerCase().includes(q));
  }

  const processingCount = docs.filter((d) => d.status === "processing").length;
  const kb = kbs.find((k) => k.id === selectedKbId);

  return (
    <div className="space-y-5 max-w-4xl">
      {/* 标题 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-zinc-900">资料库</h1>
            <span className="text-xs text-zinc-400">{kb?.name || "选择知识库"}</span>
          </div>
          <p className="text-sm text-zinc-500">上传企业资料，系统自动解析提取文本内容</p>
        </div>
        <a href="/knowledge/chat" className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">AI 问答</a>
      </div>

      {/* 知识库选择器 */}
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <span className="text-zinc-400">知识库：</span>
        <select value={selectedKbId} onChange={(e) => setSelectedKbId(e.target.value)}
          className="rounded border border-zinc-200 px-2 py-1 text-sm outline-none">
          {kbs.map((kb) => (<option key={kb.id} value={kb.id}>{kb.name}</option>))}
        </select>
        <button onClick={() => { setKbForm({ name: "", description: "" }); setKbOpen(true); }} className="text-indigo-600 hover:text-indigo-800">+ 新建</button>
        {selectedKbId && (
          <div className="flex items-center gap-1 text-zinc-400">
            {renamingKbId ? (
              <>
                <input value={renamingName} onChange={(e) => setRenamingName(e.target.value)}
                  className="w-28 rounded border px-1.5 py-0.5 text-xs" onKeyDown={(e) => { if (e.key === "Enter") { renameKb(renamingKbId, renamingName); setRenamingKbId(""); } if (e.key === "Escape") setRenamingKbId(""); }} />
                <button onClick={() => { renameKb(renamingKbId, renamingName); setRenamingKbId(""); }} className="text-indigo-500">✓</button>
                <button onClick={() => setRenamingKbId("")} className="text-zinc-400">✗</button>
              </>
            ) : (
              <>
                <button onClick={() => { const k = kbs.find((x) => x.id === selectedKbId); if (k) { setRenamingKbId(k.id); setRenamingName(k.name); } }} className="hover:text-indigo-500">重命名</button>
                <span>·</span>
                <button onClick={() => deleteKb(selectedKbId)} className="hover:text-red-500">删除</button>
              </>
            )}
          </div>
        )}
      </div>

      {/* 处理中状态 */}
      {processingCount > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-sm text-blue-700 flex items-center gap-2">
          <div className="animate-spin h-3.5 w-3.5 border-2 border-blue-400 border-t-blue-700 rounded-full" />
          {processingCount} 个文件处理中 · {new Date().toLocaleDateString("zh-CN")}
        </div>
      )}

      {/* 主 Tab：上传资料 / 网站智采 */}
      <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1 w-fit">
        <button onClick={() => setActiveTab("upload")}
          className={`px-4 py-1.5 text-sm rounded-md transition-colors ${activeTab === "upload" ? "bg-white shadow-sm text-zinc-900 font-medium" : "text-zinc-500"}`}>
          上传资料
        </button>
        <button onClick={() => setActiveTab("fetch")}
          className={`px-4 py-1.5 text-sm rounded-md transition-colors ${activeTab === "fetch" ? "bg-white shadow-sm text-zinc-900 font-medium" : "text-zinc-500"}`}>
          网站智采
        </button>
      </div>

      {/* 上传资料区域 */}
      {activeTab === "upload" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed px-8 py-10 text-center transition-colors ${dragOver ? "border-black bg-zinc-50" : "border-zinc-300 hover:border-zinc-400"}`}>
          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) doUpload(f); if (fileInputRef.current) fileInputRef.current.value = ""; }} />
          {uploading ? (
            <div className="space-y-2">
              <div className="mx-auto h-2 w-48 overflow-hidden rounded-full bg-zinc-200"><div className="h-full w-2/3 animate-pulse rounded-full bg-black" /></div>
              <p className="text-sm text-zinc-500">上传中...</p>
            </div>
          ) : (
            <>
              <div className="text-3xl">📁</div>
              <p className="mt-3 text-sm font-medium text-zinc-700">拖拽文件到此处，或点击上传</p>
              <p className="mt-1 text-xs text-zinc-400">支持 PDF、Word、PPT、Excel、TXT、Markdown · 单文件最大 50MB · 上传后自动解析</p>
            </>
          )}
        </div>
      )}

      {/* 网站智采区域 */}
      {activeTab === "fetch" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <div className="flex gap-2">
            <input type="url" value={fetchUrl} onChange={(e) => setFetchUrl(e.target.value)}
              placeholder="输入网页 URL，自动抓取内容解析入库..."
              className="flex-1 rounded-md border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-black"
              onKeyDown={(e) => e.key === "Enter" && handleFetchUrl()} />
            <button onClick={handleFetchUrl} disabled={fetching}
              className="px-5 py-2.5 text-sm font-medium bg-black text-white rounded-md hover:bg-zinc-800 disabled:opacity-50 whitespace-nowrap">
              {fetching ? "采集中..." : "采集入库"}
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-400">输入任意网页 URL，系统自动抓取文本内容、分块存储并纳入知识库</p>
        </div>
      )}

      {/* 搜索 + 状态筛选 */}
      <div className="flex items-center gap-3 flex-wrap">
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索文件名..." className="w-52 rounded-md border border-zinc-200 px-3 py-1.5 text-xs outline-none focus:border-black" />
        <div className="flex items-center gap-1">
          {STATUS_TABS.map((t) => (
            <button key={t.key} onClick={() => setStatusFilter(t.key)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${statusFilter === t.key ? "bg-black text-white" : "text-zinc-500 hover:bg-zinc-100"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-zinc-400 ml-auto">{filteredDocs.length} 个文件</span>
      </div>

      {/* 文件列表 */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-lg bg-zinc-100 animate-pulse" />)}
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <p className="text-3xl mb-2">📄</p>
          <p className="text-sm">暂无文件</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredDocs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-4 rounded-lg border border-zinc-100 bg-white px-5 py-3.5 hover:border-zinc-200 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-800 truncate">{doc.name}</span>
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs ${STATUS_COLORS[doc.status] || "bg-zinc-100 text-zinc-600"}`}>
                    {STATUS_LABELS[doc.status] || doc.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                  {doc.source_url && (
                    <span className="truncate max-w-[300px]">{doc.source_url.replace(/^https?:\/\//, "")}</span>
                  )}
                  {!doc.source_url && <span>{formatSize(doc.file_size)}</span>}
                  <span>·</span>
                  <span>{formatTime(doc.created_at)}</span>
                  {doc.chunk_count > 0 && (
                    <>
                      <span>·</span>
                      <span>{doc.chunk_count} 片段</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {doc.content_text && (
                  <button onClick={() => setShowText(doc)}
                    className="px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 rounded transition-colors">查看文本</button>
                )}
                {doc.file_url && doc.file_type !== "webpage" && (
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                    className="px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 rounded transition-colors">查看原文</a>
                )}
                {(doc.status === "ready" || doc.status === "error" || doc.status === "failed") && (
                  <button onClick={() => parseDoc(doc.id)}
                    className="px-2 py-1 text-xs text-indigo-500 hover:bg-indigo-50 rounded transition-colors">解析</button>
                )}
                <button onClick={() => deleteDoc(doc.id)}
                  className="px-2 py-1 text-xs text-red-400 hover:bg-red-50 rounded transition-colors">删除</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 查看文本弹窗 */}
      {showText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) setShowText(null); }}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-800 truncate">{showText.name}</h3>
              <button onClick={() => setShowText(null)} className="text-zinc-400 hover:text-zinc-600 text-lg">✕</button>
            </div>
            <pre className="text-xs text-zinc-600 whitespace-pre-wrap bg-zinc-50 rounded-lg p-4 max-h-[60vh] overflow-auto">{showText.content_text || "暂无文本内容"}</pre>
          </div>
        </div>
      )}

      {/* 新建知识库弹窗 */}
      {kbOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) setKbOpen(false); }}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-bold text-zinc-800">新建知识库</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">名称</label>
                <input value={kbForm.name} onChange={(e) => setKbForm({ ...kbForm, name: e.target.value })}
                  placeholder="如：产品知识库" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-black"
                  onKeyDown={(e) => e.key === "Enter" && createKb()} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">描述（可选）</label>
                <input value={kbForm.description} onChange={(e) => setKbForm({ ...kbForm, description: e.target.value })}
                  placeholder="简要描述知识库用途" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-black"
                  onKeyDown={(e) => e.key === "Enter" && createKb()} />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setKbOpen(false)} className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-md">取消</button>
              <button onClick={createKb} className="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-zinc-800">创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
