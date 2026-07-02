"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import { siteTemplates, type SiteSettings } from "@/lib/templates-site";

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
  created_at: string;
  updated_at: string;
}

const defaultSettings: SiteSettings = {
  companyName: "",
  tagline: "",
  logoUrl: "",
  primaryColor: "",
  industry: "",
  products: "",
  aboutUs: "",
  contactEmail: "",
  contactPhone: "",
  contactAddress: "",
  seoTitle: "",
  seoDescription: "",
  ogImage: "",
};

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  // 创建流程
  const [step, setStep] = useState<"list" | "template" | "form" | "generating">("list");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  // 删除
  const [delOpen, setDelOpen] = useState(false);
  const [delId, setDelId] = useState("");

  useEffect(() => {
    loadSites();
  }, []);

  async function loadSites() {
    setLoading(true);
    try {
      const res = await fetch("/api/sites");
      const json = await res.json();
      if (json.data) setSites(json.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  function startCreate() {
    setStep("template");
    setSelectedTemplate("");
    setSettings(defaultSettings);
  }

  function selectTemplate(id: string) {
    setSelectedTemplate(id);
    const t = siteTemplates.find((st) => st.id === id);
    setSettings({ ...defaultSettings, primaryColor: t?.primaryColor || "" });
    setStep("form");
  }

  async function generate() {
    if (!settings.companyName.trim()) {
      toast.error("公司名称不能为空");
      return;
    }
    setStep("generating");
    try {
      const res = await fetch("/api/sites/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: selectedTemplate, settings }),
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
        setStep("form");
      } else {
        setStep("list");
        toast.success("独立站已生成！");
        loadSites();
      }
    } catch {
      toast.error("生成失败");
      setStep("form");
    }
  }

  async function deleteSite() {
    try {
      await fetch(`/api/sites/${delId}`, { method: "DELETE" });
      toast.success("已删除");
      setDelOpen(false);
      loadSites();
    } catch {
      toast.error("删除失败");
    }
  }

  const selectedTpl = siteTemplates.find((t) => t.id === selectedTemplate);

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">独立站</h1>
            <p className="mt-2 text-sm text-zinc-500">
              AI 一键生成 B2B 独立站，选择模板 → 填写信息 → 自动生成完整页面
            </p>
          </div>
          {step === "list" && (
            <Button onClick={startCreate} className="rounded-xl bg-black text-white hover:bg-zinc-800">
              新建独立站
            </Button>
          )}
        </div>

        {step === "list" && (
          <>
            {loading ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 rounded-xl bg-zinc-100 animate-pulse" />
                ))}
              </div>
            ) : sites.length === 0 ? (
              <div className="mt-8 rounded-xl border border-dashed border-zinc-300 py-20 text-center">
                <p className="text-sm text-zinc-400 mb-4">还没有独立站，点击上方按钮创建</p>
                <Button onClick={startCreate} variant="outline" className="rounded-xl">
                  创建第一个独立站
                </Button>
              </div>
            ) : (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sites.map((site) => {
                  const tpl = siteTemplates.find((t) => t.id === site.template_id);
                  let pages: SitePage[] = [];
                  if (typeof site.pages === "string") {
                    try { pages = JSON.parse(site.pages); } catch { pages = []; }
                  } else {
                    pages = site.pages;
                  }
                  return (
                    <div
                      key={site.id}
                      className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-300 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{tpl?.icon || "🌐"}</span>
                        <div>
                          <h3 className="text-sm font-bold text-black">{site.name}</h3>
                          <p className="text-xs text-zinc-400">{tpl?.name}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {pages.map((p) => (
                          <span key={p.slug} className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                            {p.title}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-zinc-400 mb-4">
                        更新于 {new Date(site.updated_at).toLocaleDateString("zh-CN")}
                      </p>
                      <div className="flex items-center gap-2">
                        <a
                          href={`/sites/${site.id}`}
                          className="rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 transition-colors"
                        >
                          编辑 & 预览
                        </a>
                        <button
                          onClick={() => { setDelId(site.id); setDelOpen(true); }}
                          className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* 模板选择 */}
        {step === "template" && (
          <div className="mt-8">
            <button onClick={() => setStep("list")} className="text-sm text-zinc-500 hover:text-black mb-4 inline-block">
              ← 返回列表
            </button>
            <h2 className="text-lg font-bold text-black mb-4">选择网站模板</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {siteTemplates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => selectTemplate(t.id)}
                  className="rounded-2xl border border-zinc-200 bg-white p-6 text-left hover:border-black hover:shadow-sm transition-all"
                >
                  <div className="text-3xl">{t.icon}</div>
                  <h3 className="mt-3 text-sm font-bold text-black">{t.name}</h3>
                  <p className="mt-1 text-xs text-zinc-500">{t.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {t.pages.map((p) => (
                      <span key={p} className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">{p}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 公司信息填写 */}
        {step === "form" && selectedTpl && (
          <div className="mt-8">
            <button onClick={() => setStep("template")} className="text-sm text-zinc-500 hover:text-black mb-4 inline-block">
              ← 选择其他模板
            </button>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">{selectedTpl.icon}</span>
              <h2 className="text-lg font-bold text-black">{selectedTpl.name}</h2>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h3 className="text-sm font-medium text-zinc-500 mb-4">填写企业信息（AI 将根据这些信息生成全站文案）</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">公司名称 *</label>
                  <input
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    placeholder="例如：Farmetra Tech"
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">品牌标语</label>
                  <input
                    value={settings.tagline}
                    onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                    placeholder="例如：Smart Farming Solutions"
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">行业</label>
                  <input
                    value={settings.industry}
                    onChange={(e) => setSettings({ ...settings, industry: e.target.value })}
                    placeholder="例如：农业科技 / 智能制造"
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">主色</label>
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="w-full h-10 rounded-xl border border-zinc-300 cursor-pointer"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-500 mb-1">产品/服务描述</label>
                  <textarea
                    value={settings.products}
                    onChange={(e) => setSettings({ ...settings, products: e.target.value })}
                    rows={3}
                    placeholder="描述你们的主要产品、核心功能、竞争优势..."
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none resize-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-500 mb-1">公司简介</label>
                  <textarea
                    value={settings.aboutUs}
                    onChange={(e) => setSettings({ ...settings, aboutUs: e.target.value })}
                    rows={3}
                    placeholder="公司的成立背景、团队、愿景使命..."
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">联系邮箱</label>
                  <input
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    placeholder="info@company.com"
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">联系电话</label>
                  <input
                    value={settings.contactPhone}
                    onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                    placeholder="+86-xxx-xxxx"
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-500 mb-1">地址</label>
                  <input
                    value={settings.contactAddress}
                    onChange={(e) => setSettings({ ...settings, contactAddress: e.target.value })}
                    placeholder="公司地址"
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2 border-t border-zinc-100 pt-4 mt-2">
                  <p className="text-xs font-medium text-zinc-400 mb-3">SEO 设置（可选，用于搜索引擎优化）</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">SEO 标题</label>
                  <input
                    value={settings.seoTitle}
                    onChange={(e) => setSettings({ ...settings, seoTitle: e.target.value })}
                    placeholder={`留空则使用「${settings.companyName || "公司名"} - ${settings.tagline || "标语"}」`}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">SEO 描述</label>
                  <input
                    value={settings.seoDescription}
                    onChange={(e) => setSettings({ ...settings, seoDescription: e.target.value })}
                    placeholder="150 字以内的页面描述"
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button onClick={generate} className="rounded-xl bg-black text-white hover:bg-zinc-800">
                  AI 生成独立站
                </Button>
                <Button variant="outline" onClick={() => setStep("template")} className="rounded-xl">
                  返回选择模板
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 生成中 */}
        {step === "generating" && (
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-12 text-center">
            <div className="text-4xl animate-bounce mb-4">🏗️</div>
            <h3 className="text-lg font-bold text-black mb-2">AI 正在生成您的独立站...</h3>
            <p className="text-sm text-zinc-400">正在为每个页面撰写专业英文文案，大约需要 30 秒</p>
            <div className="mt-6 space-y-2">
              <div className="h-2 w-3/4 mx-auto rounded bg-zinc-100 animate-pulse" />
              <div className="h-2 w-1/2 mx-auto rounded bg-zinc-100 animate-pulse" />
              <div className="h-2 w-5/6 mx-auto rounded bg-zinc-100 animate-pulse" />
            </div>
          </div>
        )}

        <ConfirmDialog
          open={delOpen}
          onOpenChange={setDelOpen}
          title="删除独立站"
          description="删除后站点及所有页面内容将被移除，确定删除？"
          confirmLabel="删除"
          onConfirm={deleteSite}
        />
      </div>
    </div>
  );
}
