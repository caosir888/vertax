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
  const [tab, setTab] = useState<"edit" | "preview" | "settings" | "deploy" | "inquiries">("preview");
  const [editingPage, setEditingPage] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [editSettings, setEditSettings] = useState<SiteSettings>({} as SiteSettings);
  const [domain, setDomain] = useState("");
  const [inquiries, setInquiries] = useState<{ id: string; name: string; email: string; message: string; created_at: string }[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [deployOpen, setDeployOpen] = useState(false);

  useEffect(() => {
    loadSite();
  }, [id]);

  async function loadSite() {
    try {
      const res = await fetch(`/api/sites/${id}`);
      const json = await res.json();
      if (json.data) setSite(json.data);
    } catch {
      toast.error("加载失败");
    } finally {
      setLoading(false);
    }
  }

  async function loadInquiries() {
    setInquiriesLoading(true);
    try {
      const res = await fetch(`/api/sites/${id}/contact`);
      const json = await res.json();
      if (json.data) setInquiries(json.data);
    } catch {
      /* ignore */
    } finally {
      setInquiriesLoading(false);
    }
  }

  function getPages(): SitePage[] {
    if (!site) return [];
    if (typeof site.pages === "string") {
      try { return JSON.parse(site.pages); }
      catch { return []; }
    }
    return site.pages;
  }

  function getSettings(): SiteSettings {
    if (!site) return {} as SiteSettings;
    if (typeof site.settings === "string") {
      try { return JSON.parse(site.settings); }
      catch { return {} as SiteSettings; }
    }
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

  async function toggleStatus() {
    if (!site) return;
    const newStatus = site.status === "published" ? "draft" : "published";
    try {
      const res = await fetch(`/api/sites/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.data) {
        setSite(json.data);
        toast.success(newStatus === "published" ? "站点已发布" : "站点已下架");
      }
    } catch {
      toast.error("状态更新失败");
    }
  }

  async function saveDomain() {
    if (!site) return;
    const newSettings = { ...getSettings(), customDomain: domain } as unknown as Record<string, unknown>;
    try {
      const res = await fetch(`/api/sites/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: newSettings }),
      });
      const json = await res.json();
      if (json.data) {
        setSite(json.data);
        toast.success("域名已保存");
      }
    } catch {
      toast.error("保存失败");
    }
  }

  function downloadHTML() {
    if (!site) return;
    const tpl = siteTemplates.find((t) => t.id === site.template_id);
    if (!tpl) return;
    const html = renderSiteHTML(tpl, getPages(), getSettings(), site.id);    const blob = new Blob([html], { type: "text/html; charset=utf-8" });
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
  const previewHTML = tpl ? renderSiteHTML(tpl, pages, settings, site.id) : "";

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
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              site.status === "published" ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"
            }`}>
              {site.status === "published" ? "已发布" : "草稿"}
            </span>
            <Button
              onClick={toggleStatus}
              variant="outline"
              className={`rounded-xl text-sm ${site.status === "published" ? "text-red-500 hover:text-red-700" : "text-green-600 hover:text-green-700"}`}
            >
              {site.status === "published" ? "取消发布" : "发布站点"}
            </Button>
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
          <button
            onClick={() => { const s = getSettings(); setDomain((s as unknown as Record<string, string>).customDomain || ""); setTab("deploy"); }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === "deploy" ? "bg-black text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            部署
          </button>
          <button
            onClick={() => { loadInquiries(); setTab("inquiries"); }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === "inquiries" ? "bg-black text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            询盘
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
        {tab === "settings" && site && (
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
              <div className="sm:col-span-2 border-t border-zinc-100 pt-4 mt-2">
                <p className="text-xs font-medium text-zinc-400 mb-3">在线咨询</p>
              </div>
              <div className="sm:col-span-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">启用 AI 聊天助手</p>
                  <p className="text-xs text-zinc-400">在站点右下角显示智能问答按钮</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditSettings({ ...editSettings, enableChat: !editSettings.enableChat })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    editSettings.enableChat ? "bg-black" : "bg-zinc-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      editSettings.enableChat ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              {editSettings.enableChat && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-500 mb-1">欢迎语</label>
                  <input
                    value={editSettings.chatWelcomeMessage || ""}
                    onChange={(e) => setEditSettings({ ...editSettings, chatWelcomeMessage: e.target.value })}
                    placeholder="你好！有什么可以帮助你的？"
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  />
                </div>
              )}
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

        {/* 部署视图 */}
        {tab === "deploy" && (
          <div className="mt-6 space-y-6">
            {/* 发布状态卡片 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h3 className="text-sm font-bold text-black mb-4">站点状态</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-600">
                    当前状态：<span className={`font-medium ${site.status === "published" ? "text-green-600" : "text-zinc-500"}`}>
                      {site.status === "published" ? "已发布" : "草稿"}
                    </span>
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {site.status === "published"
                      ? "站点已公开可访问，任何人都可以通过预览链接查看"
                      : "仅团队成员可预览，发布后生成公开访问链接"}
                  </p>
                </div>
                <Button
                  onClick={toggleStatus}
                  className={`rounded-xl text-sm ${site.status === "published" ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700"} text-white`}
                >
                  {site.status === "published" ? "取消发布" : "发布站点"}
                </Button>
              </div>

              {site.status === "published" && (
                <div className="mt-5 rounded-xl bg-zinc-50 p-4">
                  <p className="text-xs font-medium text-zinc-500 mb-2">公开预览链接</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-white border border-zinc-200 px-3 py-2 text-sm text-zinc-700 break-all">
                      {typeof window !== "undefined" ? `${window.location.origin}/api/sites/${site.id}/preview` : `/api/sites/${site.id}/preview`}
                    </code>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/api/sites/${site.id}/preview`;
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(url);
                          toast.success("链接已复制");
                        } else {
                          toast.error("请手动复制链接");
                        }
                      }}
                      className="shrink-0 rounded-lg bg-black px-3 py-2 text-xs text-white hover:bg-zinc-800"
                    >
                      复制
                    </button>
                    <a
                      href={`/api/sites/${site.id}/preview`}
                      target="_blank"
                      className="shrink-0 rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-600 hover:bg-zinc-50"
                    >
                      打开 →
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* 自定义域名 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h3 className="text-sm font-bold text-black mb-4">自定义域名</h3>
              <p className="text-xs text-zinc-400 mb-4">
                绑定你自己的域名。你需要先在域名 DNS 中添加一条 CNAME 记录指向部署平台。
              </p>
              <div className="flex gap-2">
                <input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="例如：www.yourcompany.com"
                  className="flex-1 rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
                <Button onClick={saveDomain} className="rounded-xl bg-black text-white hover:bg-zinc-800 text-sm">
                  保存域名
                </Button>
              </div>
            </div>

            {/* 部署指南 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h3 className="text-sm font-bold text-black mb-4">部署指南</h3>
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-medium text-zinc-700 mb-2">方式一：下载 HTML 上传</p>
                  <div className="rounded-lg bg-zinc-50 p-4 text-xs text-zinc-500 space-y-1">
                    <p>1. 点击上方「下载 HTML」按钮</p>
                    <p>2. 登录 Vercel / Netlify / Cloudflare Pages</p>
                    <p>3. 将下载的 .html 文件拖入部署面板</p>
                    <p>4. 自动生成域名，完成部署</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-700 mb-2">方式二：绑定 GitHub 自动部署</p>
                  <div className="rounded-lg bg-zinc-50 p-4 text-xs text-zinc-500 space-y-1">
                    <p>1. 将 HTML 上传到 GitHub 仓库</p>
                    <p>2. 在 Vercel 中 Import 该仓库</p>
                    <p>3. 每次更新后重新下载 HTML 推送到仓库即可自动部署</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-700 mb-2">自定义域名设置</p>
                  <div className="rounded-lg bg-zinc-50 p-4 text-xs text-zinc-500 space-y-1">
                    <p>1. 在域名 DNS 中添加 CNAME 记录</p>
                    <p>2. CNAME 指向：<code>cname.vercel-dns.com</code>（Vercel）或 Netlify/Cloudflare 的对应地址</p>
                    <p>3. 在部署平台 Settings → Domains 中添加你的域名</p>
                    <p>4. 等待 DNS 生效（通常 5-30 分钟）</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 询盘视图 */}
        {tab === "inquiries" && (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-black">客户询盘</h3>
              <button
                onClick={loadInquiries}
                disabled={inquiriesLoading}
                className="text-xs text-indigo-500 hover:text-indigo-700"
              >
                {inquiriesLoading ? "刷新中..." : "刷新"}
              </button>
            </div>

            {inquiries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-3xl mb-2">📬</p>
                <p className="text-sm text-zinc-400">暂无询盘</p>
                <p className="text-xs text-zinc-300 mt-1">访客通过站点联系表单提交后将显示在这里</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inquiries.map((inq) => (
                  <div key={inq.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-black">{inq.name}</p>
                        <p className="text-xs text-zinc-400">{inq.email}</p>
                      </div>
                      <span className="text-xs text-zinc-400">
                        {new Date(inq.created_at).toLocaleString("zh-CN")}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600 leading-relaxed">{inq.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
