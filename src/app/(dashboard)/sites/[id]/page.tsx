"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { siteTemplates, renderSiteHTML, type SiteSettings } from "@/lib/templates-site";

interface SitePage {
  title: string;
  slug: string;
  content: string;
}

interface Site {
  id: string;
  name: string;
  template_id: string;
  pages: SitePage[] | string;
  settings: SiteSettings | string;
  status: string;
}

export default function SiteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"edit" | "preview" | "settings">("preview");
  const [editingPage, setEditingPage] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [editSettings, setEditSettings] = useState<SiteSettings>({} as SiteSettings);

  useEffect(() => {
    loadSite();
  }, [id]);

  async function loadSite() {
    const res = await fetch(`/api/sites/${id}`);
    const json = await res.json();
    if (json.data) setSite(json.data);
    setLoading(false);
  }

  function getPages(): SitePage[] {
    if (!site) return [];
    if (typeof site.pages === "string") return JSON.parse(site.pages);
    return site.pages;
  }

  function getSettings(): SiteSettings {
    if (!site) return {} as SiteSettings;
    if (typeof site.settings === "string") return JSON.parse(site.settings);
    return site.settings;
  }

  function startEdit(index: number) {
    setEditingPage(index);
    setEditContent(getPages()[index]?.content || "");
  }

  async function savePage() {
    if (!site || editingPage === null) return;
    setSaving(true);
    const pages = getPages();
    pages[editingPage] = { ...pages[editingPage], content: editContent };

    try {
      await fetch(`/api/sites/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages }),
      });
      toast.success("已保存");
      setSite({ ...site, pages });
      setEditingPage(null);
    } catch {
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function movePage(index: number, direction: -1 | 1) {
    if (!site) return;
    const pages = getPages();
    const target = index + direction;
    if (target < 0 || target >= pages.length) return;

    const temp = pages[index];
    pages[index] = pages[target];
    pages[target] = temp;

    try {
      const res = await fetch(`/api/sites/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages }),
      });
      const json = await res.json();
      if (json.data) {
        setSite(json.data);
        if (editingPage === index) setEditingPage(target);
        else if (editingPage === target) setEditingPage(index);
      }
    } catch {
      toast.error("排序失败");
    }
  }

  function startEditSettings() {
    setEditSettings(getSettings());
    setTab("settings");
  }

  async function saveSettings() {
    if (!site) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/sites/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: editSettings }),
      });
      const json = await res.json();
      if (json.data) {
        setSite(json.data);
        toast.success("设置已保存");
      }
    } catch {
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  }

  function downloadHTML() {
    if (!site) return;
    const tpl = siteTemplates.find((t) => t.id === site.template_id);
    if (!tpl) return;
    const html = renderSiteHTML(tpl, getPages(), getSettings());
    const blob = new Blob([html], { type: "text/html; charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${site.name.replace(/\s+/g, "-").toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("HTML 已下载");
  }

  if (loading) {
    return (
      <div className="px-4 py-8 sm:px-8 sm:py-12">
        <div className="mx-auto max-w-5xl">
          <div className="h-8 w-48 rounded bg-zinc-100 animate-pulse mb-4" />
          <div className="h-96 rounded-xl bg-zinc-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="px-4 py-8 sm:px-8 sm:py-12">
        <div className="mx-auto max-w-5xl text-center py-20">
          <p className="text-sm text-zinc-400">站点不存在</p>
          <a href="/sites" className="text-sm text-black underline mt-2 inline-block">返回列表</a>
        </div>
      </div>
    );
  }

  const pages = getPages();
  const settings = getSettings();
  const tpl = siteTemplates.find((t) => t.id === site.template_id);
  const previewHTML = tpl ? renderSiteHTML(tpl, pages, settings) : "";

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        {/* 头部 */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <a href="/sites" className="text-sm text-zinc-500 hover:text-black transition-colors">
              ← 返回列表
            </a>
            <h1 className="text-2xl font-bold text-black mt-1">{site.name}</h1>
            <p className="text-sm text-zinc-400">{tpl?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={downloadHTML} variant="outline" className="rounded-xl">
              下载 HTML
            </Button>
          </div>
        </div>

        {/* 标签切换 */}
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => setTab("edit")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === "edit" ? "bg-black text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            编辑页面
          </button>
          <button
            onClick={() => setTab("preview")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === "preview" ? "bg-black text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            在线预览
          </button>
          <button
            onClick={() => startEditSettings()}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === "settings" ? "bg-black text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            站点设置
          </button>
        </div>

        {/* 编辑视图 */}
        {tab === "edit" && (
          <div className="mt-6 space-y-4">
            {pages.map((page, i) => (
              <div key={page.slug} className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-zinc-50 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => movePage(i, -1)}
                        disabled={i === 0}
                        className="text-[10px] leading-none text-zinc-300 hover:text-zinc-600 disabled:opacity-20 disabled:cursor-not-allowed"
                        title="上移"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => movePage(i, 1)}
                        disabled={i === pages.length - 1}
                        className="text-[10px] leading-none text-zinc-300 hover:text-zinc-600 disabled:opacity-20 disabled:cursor-not-allowed"
                        title="下移"
                      >
                        ▼
                      </button>
                    </div>
                    <span className="text-sm font-medium text-black">{page.title}</span>
                    <span className="text-xs text-zinc-400">/{page.slug}</span>
                  </div>
                  {editingPage !== i && (
                    <button
                      onClick={() => startEdit(i)}
                      className="text-xs text-indigo-500 hover:text-indigo-700"
                    >
                      编辑
                    </button>
                  )}
                </div>
                <div className="p-5">
                  {editingPage === i ? (
                    <div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={14}
                        className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm font-mono focus:border-black focus:outline-none resize-none"
                      />
                      <div className="mt-3 flex gap-2">
                        <Button onClick={savePage} disabled={saving} className="rounded-xl bg-black text-white hover:bg-zinc-800 text-sm">
                          {saving ? "保存中..." : "保存"}
                        </Button>
                        <Button variant="outline" onClick={() => setEditingPage(null)} className="rounded-xl text-sm">
                          取消
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                      {page.content || <span className="text-zinc-300 italic">暂无内容</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 预览视图 */}
        {tab === "preview" && (
          <div className="mt-6 rounded-xl border border-zinc-300 overflow-hidden">
            <div className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1.5 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="ml-2">预览 — {site.name}</span>
            </div>
            <iframe
              srcDoc={previewHTML}
              className="w-full h-[600px] border-0"
              title="Site Preview"
            />
          </div>
        )}

        {/* 设置视图 */}
        {tab === "settings" && editSettings.companyName !== undefined && (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
            <h3 className="text-sm font-bold text-black mb-5">站点设置</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">公司名称</label>
                <input
                  value={editSettings.companyName || ""}
                  onChange={(e) => setEditSettings({ ...editSettings, companyName: e.target.value })}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">品牌标语</label>
                <input
                  value={editSettings.tagline || ""}
                  onChange={(e) => setEditSettings({ ...editSettings, tagline: e.target.value })}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">行业</label>
                <input
                  value={editSettings.industry || ""}
                  onChange={(e) => setEditSettings({ ...editSettings, industry: e.target.value })}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">主色</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editSettings.primaryColor || "#000000"}
                    onChange={(e) => setEditSettings({ ...editSettings, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-zinc-300 cursor-pointer"
                  />
                  <input
                    value={editSettings.primaryColor || ""}
                    onChange={(e) => setEditSettings({ ...editSettings, primaryColor: e.target.value })}
                    className="flex-1 rounded-xl border border-zinc-300 px-3 py-2 text-sm font-mono focus:border-black focus:outline-none"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-500 mb-1">产品/服务描述</label>
                <textarea
                  value={editSettings.products || ""}
                  onChange={(e) => setEditSettings({ ...editSettings, products: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none resize-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-500 mb-1">公司简介</label>
                <textarea
                  value={editSettings.aboutUs || ""}
                  onChange={(e) => setEditSettings({ ...editSettings, aboutUs: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">联系邮箱</label>
                <input
                  value={editSettings.contactEmail || ""}
                  onChange={(e) => setEditSettings({ ...editSettings, contactEmail: e.target.value })}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">联系电话</label>
                <input
                  value={editSettings.contactPhone || ""}
                  onChange={(e) => setEditSettings({ ...editSettings, contactPhone: e.target.value })}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2 border-t border-zinc-100 pt-4 mt-2">
                <p className="text-xs font-medium text-zinc-400 mb-3">SEO 设置</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">SEO 标题</label>
                <input
                  value={editSettings.seoTitle || ""}
                  onChange={(e) => setEditSettings({ ...editSettings, seoTitle: e.target.value })}
                  placeholder="浏览器标题栏和搜索引擎结果标题"
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">SEO 描述</label>
                <input
                  value={editSettings.seoDescription || ""}
                  onChange={(e) => setEditSettings({ ...editSettings, seoDescription: e.target.value })}
                  placeholder="搜索引擎结果中的描述文字"
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button onClick={saveSettings} disabled={saving} className="rounded-xl bg-black text-white hover:bg-zinc-800">
                {saving ? "保存中..." : "保存设置"}
              </Button>
              <Button variant="outline" onClick={() => setTab("preview")} className="rounded-xl">
                取消
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
