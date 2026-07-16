"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

interface OutlineItem { id: number; text: string; }

interface GeoData {
  faq_schema?: { mainEntity?: Array<{ name: string; acceptedAnswer: { text: string } }> };
  article_schema?: { headline?: string; description?: string };
  geo_summary?: string;
  geo_title?: string;
}

interface ContentData {
  id: string;
  title: string;
  content: string;
  slug: string;
  seo_title: string;
  seo_description: string;
  outline: OutlineItem[];
  category: string;
  status: string;
  tags: string[];
  language: string;
  publish_date: string | null;
  geo_data?: GeoData | null;
}

export default function ContentEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingOutline, setGeneratingOutline] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);

  // 编辑状态
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [status, setStatus] = useState("draft");
  const [publishDate, setPublishDate] = useState("");
  const [geoData, setGeoData] = useState<GeoData | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contents/${id}`);
      const json = await res.json();
      if (json.data) {
        setData(json.data);
        setTitle(json.data.title || "");
        setSlug(json.data.slug || "");
        setCategory(json.data.category || "");
        setContent(json.data.content || "");
        setSeoTitle(json.data.seo_title || "");
        setSeoDescription(json.data.seo_description || "");
        setOutline(json.data.outline || []);
        setStatus(json.data.status || "draft");
        setPublishDate(json.data.publish_date ? json.data.publish_date.substring(0, 16) : "");
        setGeoData(json.data.geo_data || null);
      }
    } catch { toast.error("加载内容失败"); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/contents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, slug, category, content,
          seo_title: seoTitle, seo_description: seoDescription,
          outline, status,
          publish_date: publishDate ? new Date(publishDate).toISOString() : null,
        }),
      });
      const json = await res.json();
      if (json.data) {
        toast.success("已保存");
      } else {
        toast.error(json.error || "保存失败");
      }
    } catch { toast.error("保存失败"); }
    finally { setSaving(false); }
  };

  const handleGenerateOutline = async () => {
    setGeneratingOutline(true);
    try {
      const res = await fetch(`/api/contents/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-outline", topic: title }),
      });
      const json = await res.json();
      if (json.data?.outline) {
        setOutline(json.data.outline);
        toast.success(`已生成 ${json.data.outline.length} 条大纲`);
      } else {
        toast.error(json.error || "生成失败");
      }
    } catch { toast.error("生成大纲失败"); }
    finally { setGeneratingOutline(false); }
  };

  const handleGenerateContent = async () => {
    setGeneratingContent(true);
    try {
      const res = await fetch(`/api/contents/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-content" }),
      });
      const json = await res.json();
      if (json.data?.content) {
        setContent(json.data.content);
        toast.success("内容已生成");
      } else {
        toast.error(json.error || "生成失败");
      }
    } catch { toast.error("生成内容失败"); }
    finally { setGeneratingContent(false); }
  };

  const generateSlug = (t: string) => {
    return t
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .trim()
      .substring(0, 80);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-12 rounded-xl bg-zinc-100 animate-pulse" />)}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* 顶栏 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-black">编辑内容</h1>
          <p className="text-xs text-zinc-400 mt-1">
            基于: {data?.title?.substring(0, 40)}{(data?.title?.length || 0) > 40 ? "..." : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-black px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>

      {/* 标题 */}
      <div className="mb-4">
        <input
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); if (!slug) setSlug(generateSlug(e.target.value)); }}
          placeholder="输入文章标题"
          className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-lg font-semibold text-black outline-none focus:border-black transition-colors"
        />
      </div>

      {/* Slug + 分类 + 发布时间 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Slug</label>
          <input
            type="text" value={slug} onChange={(e) => setSlug(e.target.value)}
            placeholder="url-friendly-slug"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-black"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">分类</label>
          <input
            type="text" value={category} onChange={(e) => setCategory(e.target.value)}
            placeholder="默认分类"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-black"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">发布时间</label>
          <input
            type="datetime-local" value={publishDate} onChange={(e) => setPublishDate(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-black"
          />
        </div>
      </div>

      {/* 内容大纲 */}
      <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-black">内容大纲</h3>
          <div className="flex items-center gap-2">
            {outline.length > 0 && (
              <button
                onClick={handleGenerateOutline}
                disabled={generatingOutline}
                className="text-xs text-zinc-500 hover:text-black disabled:opacity-50"
              >
                重新生成大纲
              </button>
            )}
            <button
              onClick={handleGenerateOutline}
              disabled={generatingOutline}
              className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 disabled:opacity-50"
            >
              {generatingOutline ? "生成中..." : outline.length === 0 ? "AI 生成大纲" : "重新生成大纲"}
            </button>
          </div>
        </div>
        {outline.length > 0 ? (
          <ol className="space-y-1">
            {outline.map((item) => (
              <li key={item.id} className="text-sm text-zinc-700 pl-1">
                {item.id}. {item.text}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-zinc-400">点击"AI 生成大纲"基于标题自动生成结构化大纲</p>
        )}
      </div>

      {/* AI 生成内容 */}
      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={handleGenerateContent}
          disabled={generatingContent}
          className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {generatingContent ? "AI 生成中..." : "AI 生成内容"}
        </button>
        <span className="text-xs text-zinc-400">基于大纲自动生成完整文章</span>
      </div>

      {/* 内容编辑器 */}
      <div className="mb-6">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="在此编辑内容，或点击上方按钮由 AI 生成..."
          rows={30}
          className="w-full rounded-xl border border-zinc-200 px-4 py-4 text-sm text-zinc-800 font-mono leading-relaxed outline-none focus:border-black resize-y"
        />
      </div>

      {/* SEO 设置 */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 mb-6">
        <h3 className="text-sm font-bold text-black mb-4">SEO 设置</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">SEO 标题 (Meta Title)</label>
            <input
              type="text" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="留空则使用文章标题"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-black"
            />
            <p className="text-[10px] text-zinc-400 mt-0.5">{seoTitle.length} / 60 字符（建议 30-60）</p>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">SEO 描述 (Meta Description)</label>
            <textarea
              value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="留空则自动截取正文前160字符"
              rows={3}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-black resize-none"
            />
            <p className="text-[10px] text-zinc-400 mt-0.5">{seoDescription.length} / 160 字符（建议 120-160）</p>
          </div>
        </div>
      </div>

      {/* GEO 结构化数据 */}
      {geoData && (geoData.faq_schema || geoData.article_schema || geoData.geo_summary) ? (
        <div className="rounded-xl border border-green-200 bg-green-50/50 p-5 mb-6">
          <h3 className="text-sm font-bold text-green-800 mb-4">
            GEO 结构化数据 <span className="text-xs text-green-600 ml-1 font-normal">已发布 · AI 搜索引擎可索引</span>
          </h3>

          {geoData.faq_schema?.mainEntity && geoData.faq_schema.mainEntity.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-zinc-600 mb-2">FAQ JSON-LD Schema</p>
              <div className="space-y-2">
                {geoData.faq_schema.mainEntity.map((faq, i) => (
                  <details key={i} className="rounded-lg border border-green-100 bg-white p-3">
                    <summary className="text-sm font-medium text-zinc-800 cursor-pointer">{faq.name}</summary>
                    <p className="text-sm text-zinc-600 mt-2 leading-relaxed">{faq.acceptedAnswer?.text}</p>
                  </details>
                ))}
              </div>
            </div>
          )}

          {geoData.article_schema && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-zinc-600 mb-2">Article JSON-LD Schema</p>
              <pre className="rounded-lg border border-green-100 bg-white p-3 text-xs text-zinc-700 overflow-x-auto">
                {JSON.stringify(geoData.article_schema, null, 2)}
              </pre>
            </div>
          )}

          {geoData.geo_summary && (
            <div>
              <p className="text-xs font-semibold text-zinc-600 mb-2">GEO 引文摘要</p>
              <p className="text-sm text-zinc-700 leading-relaxed rounded-lg border border-green-100 bg-white p-3">{geoData.geo_summary}</p>
            </div>
          )}

          <details className="mt-3">
            <summary className="text-xs text-zinc-400 cursor-pointer hover:text-zinc-600">查看完整 JSON-LD</summary>
            <pre className="mt-2 rounded-lg border border-zinc-200 bg-white p-3 text-xs text-zinc-600 overflow-x-auto max-h-64">
              {JSON.stringify(geoData, null, 2)}
            </pre>
          </details>
        </div>
      ) : null}

      {/* 状态 + 操作 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none"
          >
            <option value="draft">草稿</option>
            <option value="review">审核中</option>
            <option value="published">已发布</option>
          </select>
          <button
            onClick={() => router.push("/growth")}
            className="text-xs text-zinc-400 hover:text-black"
          >
            ← 返回增长系统
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-black px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </div>
    </div>
  );
}
