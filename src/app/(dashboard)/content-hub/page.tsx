"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ChevronDown, Check, Loader2, Sparkles, ExternalLink, FileText, Globe, BarChart3, Copy, Eye } from "lucide-react";
import { templates, languages } from "@/lib/templates";
import { Toaster, toast } from "sonner";

interface Question {
  question: string;
  intent: string;
}

interface PlanData {
  awareness: Question[];
  consideration: Question[];
  decision: Question[];
}

interface StepStatus {
  label: string;
  score?: string;
  error?: string;
}

interface OptimizeResults {
  seo: { score?: number; title?: string; description?: string; error?: string } | null;
  aeo: { schema_generated?: boolean; faq_count?: number; error?: string } | null;
  geo: { id?: string; title?: string; summary?: string; framework?: string; error?: string } | null;
  llms_txt?: string;
}

const STEPS = [
  { key: "plan", label: "策划", desc: "问题库" },
  { key: "create", label: "创作", desc: "答案优先" },
  { key: "optimize", label: "优化", desc: "一键三检" },
  { key: "publish", label: "发布&监测", desc: "统一看板" },
];

const PLATFORM_OPTIONS: Record<string, string> = {
  website: "官网",
  wechat: "微信公众号",
  linkedin: "LinkedIn",
  email: "邮件",
  media: "媒体投稿",
  manual: "手动发布",
  other: "其他",
};

const JOURNEY_LABELS: Record<string, string> = {
  awareness: "认知阶段",
  consideration: "考虑阶段",
  decision: "决策阶段",
};

export default function ContentHubPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1: Plan
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [context, setContext] = useState("");
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());

  // Step 2: Create
  const [selectedTemplate, setSelectedTemplate] = useState("answer-first");
  const [plannerOutput, setPlannerOutput] = useState<Record<string, string>>({});
  const [templateVars, setTemplateVars] = useState<Record<string, string>>({});
  const [language, setLanguage] = useState("zh-CN");
  const [generatedContent, setGeneratedContent] = useState("");
  const [contentTitle, setContentTitle] = useState("");
  const [savedContentId, setSavedContentId] = useState<string | null>(null);

  // plannerOutput 保存从 Step 1 带入的不可变值，templateVars 保存用户在 Step 2 的编辑
  // 渲染时合并：plannerOutput 作为基底，templateVars 可覆盖
  function getEffectiveVars(): Record<string, string> {
    const defaults = getDefaultVars();
    return { ...defaults, ...plannerOutput, ...templateVars };
  }

  // Step 3: Optimize
  const [optimizeLoading, setOptimizeLoading] = useState(false);
  const [optimizeResults, setOptimizeResults] = useState<OptimizeResults | null>(null);
  const [optimizeSteps, setOptimizeSteps] = useState<StepStatus[]>([
    { label: "SEO 审计修复" },
    { label: "AEO 结构化" },
    { label: "GEO 引擎适配" },
  ]);
  const [currentOptStep, setCurrentOptStep] = useState(-1);

  // Step 4: Publish & Monitor
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishForm, setPublishForm] = useState({ platform: "website", url: "", notes: "" });
  const [publishResult, setPublishResult] = useState<{ platform: string; url: string } | null>(null);
  const [showSchema, setShowSchema] = useState(false);

  // Analytics data for the published content
  const [analytics, setAnalytics] = useState<{
    views: number; clicks: number; likes: number; comments: number; shares: number;
    engagement: number; seo_score?: number; aeo_score?: number;
    track_view_url?: string;
  } | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  async function fetchAnalytics(contentId: string) {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/content/${contentId}/analytics`);
      const json = await res.json();
      if (json.data) {
        setAnalytics({
          views: json.data.views || 0,
          clicks: json.data.clicks || 0,
          likes: json.data.likes || 0,
          comments: json.data.comments || 0,
          shares: json.data.shares || 0,
          engagement: json.data.engagement || 0,
          seo_score: json.data.seo?.overall_score || json.data.seo?.score,
          aeo_score: json.data.seo?.aeo_score,
          track_view_url: json.data.track_view_url,
        });
      }
    } catch { /* ignore */ }
    finally { setAnalyticsLoading(false); }
  }

  // 获取当前模板的默认变量（不自动 reset，避免覆盖从 Step 1 带入的值）
  function getDefaultVars(): Record<string, string> {
    const tpl = templates.find((t) => t.id === selectedTemplate);
    if (!tpl) return {};
    const vars: Record<string, string> = {};
    tpl.variables.forEach((v) => { vars[v.key] = ""; });
    return vars;
  }

  function toggleQuestion(q: string) {
    setSelectedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(q)) next.delete(q);
      else next.add(q);
      return next;
    });
  }

  // ====== Step 1: AI 生成问题库 ======
  async function handlePlan() {
    if (!topic.trim()) return toast.error("请输入话题/主题");
    setLoading(true);
    try {
      const res = await fetch("/api/content-hub/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), audience: audience.trim(), context: context.trim() }),
      });
      const json = await res.json();
      if (json.data) {
        setPlanData(json.data);
        toast.success("问题库生成成功");
      } else {
        toast.error(json.error || "生成失败");
      }
    } catch {
      toast.error("请求失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  function handleProceedToCreate() {
    if (selectedQuestions.size === 0) {
      toast.error("请至少选择一个问题");
      return;
    }
    const qs = Array.from(selectedQuestions);
    setPlannerOutput({
      question: qs[0] || "",
      topic: topic,
      target_audience: audience,
      key_points: qs.join("；"),
    });
    setStep(1);
  }

  // ====== Step 2: AI 生成内容 ======
  async function handleGenerate() {
    const tpl = templates.find((t) => t.id === selectedTemplate);
    if (!tpl) return toast.error("请选择模板");
    const vars = getEffectiveVars();
    setLoading(true);
    try {
      const res = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: selectedTemplate,
          variables: { ...vars },
          language,
        }),
      });
      const json = await res.json();
      if (json.data?.versions?.[0]) {
        const v = json.data.versions[0];
        const text = typeof v === "string" ? v : v.content || "";
        setGeneratedContent(text);
        const titleMatch = text.match(/^#{1,2}\s*(.+)/m);
        setContentTitle(titleMatch ? titleMatch[1].trim() : vars.topic || "新内容");
        toast.success("内容生成成功");
      } else if (json.data?.content) {
        setGeneratedContent(json.data.content);
        setContentTitle(vars.topic || "新内容");
        toast.success("内容生成成功");
      } else {
        toast.error(json.error || "生成失败");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "请求失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveDraft() {
    if (!generatedContent) return toast.error("请先生成内容");
    setLoading(true);
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: contentTitle,
          content: generatedContent,
          template_id: selectedTemplate,
          language,
          status: "draft",
          tags: [getEffectiveVars().question || "", getEffectiveVars().topic || ""].filter(Boolean),
        }),
      });
      const json = await res.json();
      if (json.data?.id) {
        setSavedContentId(json.data.id);
        toast.success("已保存为草稿");
      } else {
        toast.error(json.error || "保存失败");
      }
    } catch {
      toast.error("保存失败");
    } finally {
      setLoading(false);
    }
  }

  // ====== Step 3: 一键智能优化 (SSE 实时进度) ======
  async function handleOptimize() {
    if (!savedContentId) {
      toast.error("请先保存内容为草稿");
      return;
    }
    setOptimizeLoading(true);
    setCurrentOptStep(-1);
    setOptimizeResults(null);
    setStep(2);

    const stepLabels = ["SEO 审计修复", "AEO 结构化", "GEO 引擎适配"];
    setOptimizeSteps(stepLabels.map((l) => ({ label: l })));

    try {
      const res = await fetch("/api/content-hub/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_id: savedContentId, stream: true }),
      });

      if (!res.ok || !res.body) {
        // 降级：服务器不支持 SSE，回退到 JSON 模式
        const json = await res.json();
        if (json.data) {
          setOptimizeResults(json.data);
          toast.success("智能化优化完成");
        } else {
          toast.error(json.error || "优化失败");
        }
        setOptimizeLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let final: OptimizeResults = { seo: null, aeo: null, geo: null };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let eventType = "";
      for (const line of lines) {
        if (line.startsWith("event: ")) {
          eventType = line.slice(7).trim();
          continue;
        }
        if (line.startsWith("data: ")) {
          try {
            const payload = JSON.parse(line.slice(6));
              const eventType = payload.name || "";

              if (payload.step) setCurrentOptStep(payload.step - 1);

              if (eventType === "seo") {
                // step_done for seo
                setOptimizeSteps((prev) => {
                  const next = [...prev];
                  next[0] = { label: "SEO 审计修复", score: payload.result?.error ? "失败" : `评分 ${payload.result?.score || "—"}`, error: payload.result?.error };
                  return next;
                });
                final.seo = payload.result;
              } else if (eventType === "aeo") {
                setOptimizeSteps((prev) => {
                  const next = [...prev];
                  next[1] = { label: "AEO 结构化", score: payload.result?.error ? "失败" : `已生成 ${payload.result?.faq_count || 0} 条 FAQ Schema`, error: payload.result?.error };
                  return next;
                });
                final.aeo = payload.result;
              } else if (eventType === "geo") {
                setOptimizeSteps((prev) => {
                  const next = [...prev];
                  next[2] = { label: "GEO 引擎适配", score: payload.result?.error ? "失败" : `框架: ${payload.result?.framework || "—"}`, error: payload.result?.error };
                  return next;
                });
                final.geo = payload.result;
                final.llms_txt = payload.llms_txt;
              } else if (payload.message === "优化完成") {
                final = { seo: payload.seo, aeo: payload.aeo, geo: payload.geo, llms_txt: payload.llms_txt };
              }
            } catch { /* skip malformed */ }
          }
        }
      }

      setOptimizeResults(final);
      toast.success("智能化优化完成");
    } catch {
      toast.error("优化请求失败");
      setOptimizeSteps(stepLabels.map((l) => ({ label: l, error: "失败" })));
    } finally {
      setOptimizeLoading(false);
    }
  }

  // ====== Step 4: 发布 ======
  async function handlePublish() {
    if (!savedContentId) return toast.error("请先保存内容");
    setPublishLoading(true);
    try {
      const res = await fetch(`/api/content/${savedContentId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: publishForm.platform,
          url: publishForm.url,
          notes: publishForm.notes || "智能内容中心一键发布",
        }),
      });
      const json = await res.json();
      if (json.data) {
        setPublishResult({ platform: publishForm.platform, url: publishForm.url });
        toast.success("发布成功");
        fetchAnalytics(savedContentId!);
      } else {
        toast.error(json.error || "发布失败");
      }
    } catch {
      toast.error("发布请求失败");
    } finally {
      setPublishLoading(false);
    }
  }

  // ====== Render Helpers ======

  function renderStepIndicator() {
    return (
      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((s, i) => {
          const isActive = i === step;
          const isDone = i < step;
          const isClickable = i <= step || (i === step + 1 && (i === 1 ? selectedQuestions.size > 0 : i === 2 ? savedContentId : true));
          return (
            <div key={s.key} className="flex items-center gap-1">
              {i > 0 && <div className={`w-6 h-px ${i <= step ? "bg-black" : "bg-zinc-200"}`} />}
              <button
                onClick={() => { if (i <= step) setStep(i); }}
                disabled={i > step}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  isActive ? "bg-black text-white" : isDone ? "bg-zinc-100 text-zinc-500 hover:bg-zinc-200" : "bg-zinc-50 text-zinc-300"
                }`}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : <span className="text-xs">{i + 1}</span>}
                <span className="hidden sm:inline">{s.label}</span>
                <span className="text-xs opacity-70 hidden sm:inline">{s.desc}</span>
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  function renderStep1Plan() {
    return (
      <div className="max-w-3xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-black mb-1">从"关键词"到"问题"</h2>
          <p className="text-sm text-zinc-500">输入你的话题和目标客户，AI 将生成用户在不同购买阶段会问的真实问题。</p>
        </div>

        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">话题/主题 *</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="如：B2B企业如何用AI提升获客效率"
              className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">目标客户</label>
              <input
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="如：外贸企业主、销售总监"
                className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">补充背景</label>
              <input
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="产品/行业/竞品信息（可选）"
                className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handlePlan}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 transition-all"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          AI 生成问题库
        </button>

        {planData && (
          <div className="space-y-4">
            {(["awareness", "consideration", "decision"] as const).map((stage) => (
              <div key={stage} className="rounded-xl border border-zinc-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-black mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold">{stage === "awareness" ? "①" : stage === "consideration" ? "②" : "③"}</span>
                  {JOURNEY_LABELS[stage]}
                  <span className="text-xs text-zinc-400 font-normal">• {planData[stage].length} 个问题</span>
                </h3>
                <div className="space-y-1.5">
                  {planData[stage].map((q, idx) => {
                    const key = q.question;
                    const sel = selectedQuestions.has(key);
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleQuestion(key)}
                        className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition-all ${
                          sel ? "bg-black text-white" : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                            sel ? "border-white text-white" : "border-zinc-300"
                          }`}>
                            {sel ? "✓" : ""}
                          </span>
                          <div>
                            <p className="font-medium">{q.question}</p>
                            <p className={`text-xs mt-0.5 ${sel ? "text-zinc-300" : "text-zinc-400"}`}>{q.intent}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              onClick={handleProceedToCreate}
              disabled={selectedQuestions.size === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 transition-all"
            >
              已选 {selectedQuestions.size} 个问题，进入创作
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderStep2Create() {
    const tpl = templates.find((t) => t.id === selectedTemplate);
    return (
      <div className="max-w-3xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-black mb-1">为 AI "量身定制"内容</h2>
          <p className="text-sm text-zinc-500">Answer-First 结构，E-E-A-T 信号，让内容和 AI 引擎都能高效理解。</p>
        </div>

        {/* 模板选择 */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">内容模板</label>
          <div className="flex gap-2 flex-wrap">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => { setSelectedTemplate(t.id); setTemplateVars({}); }}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                  selectedTemplate === t.id ? "border-black bg-black text-white" : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                }`}
              >
                <span>{t.icon}</span>
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* 模板变量 */}
        {tpl && (
          <div className="grid gap-4">
            {tpl.variables.map((v) => (
              <div key={v.key}>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  {v.label}
                  {planData && selectedQuestions.size > 0 && v.key === "question" && (
                    <span className="text-xs text-zinc-400 ml-1">（已从问题库带入）</span>
                  )}
                </label>
                {v.key === "key_points" || v.key === "target_audience" ? (
                  <textarea
                    value={getEffectiveVars()[v.key] || ""}
                    onChange={(e) => setTemplateVars({ ...templateVars, [v.key]: e.target.value })}
                    placeholder={v.placeholder}
                    rows={3}
                    className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
                  />
                ) : (
                  <input
                    value={getEffectiveVars()[v.key] || ""}
                    onChange={(e) => setTemplateVars({ ...templateVars, [v.key]: e.target.value })}
                    placeholder={v.placeholder}
                    className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                )}
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">语言</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            AI 生成内容
          </button>
          {generatedContent && (
            <button
              onClick={handleSaveDraft}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-6 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <FileText className="h-4 w-4" />
              保存为草稿
            </button>
          )}
        </div>

        {/* 生成结果 */}
        {generatedContent && (
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50">
              <div className="flex items-center gap-2">
                <input
                  value={contentTitle}
                  onChange={(e) => setContentTitle(e.target.value)}
                  className="text-sm font-semibold text-black bg-transparent focus:outline-none border-b border-transparent focus:border-zinc-300 px-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(generatedContent); toast.success("已复制"); }}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-500 hover:text-black hover:bg-zinc-100"
                >
                  <Copy className="h-3 w-3" />复制
                </button>
              </div>
            </div>
            <textarea
              value={generatedContent}
              onChange={(e) => setGeneratedContent(e.target.value)}
              className="w-full px-4 py-4 text-sm text-zinc-700 bg-white focus:outline-none resize-none min-h-[300px] font-mono leading-relaxed"
            />
          </div>
        )}

        {/* 进入优化 */}
        {savedContentId && (
          <button
            onClick={handleOptimize}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition-all"
          >
            进入智能优化
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  function renderStep3Optimize() {
    return (
      <div className="max-w-3xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-black mb-1">给 AI 递上"说明书"</h2>
          <p className="text-sm text-zinc-500">一键完成 SEO 审计修复 + AEO 结构化标记 + GEO 引擎适配。</p>
        </div>

        {!optimizeResults && !optimizeLoading && (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
            <Globe className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm mb-4">
              {savedContentId ? "内容已就绪，点击下方开始智能优化" : "请先在「创作」步骤中保存内容"}
            </p>
            {savedContentId && (
              <button
                onClick={handleOptimize}
                className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
              >
                <Sparkles className="h-4 w-4" />
                一键智能优化
              </button>
            )}
          </div>
        )}

        {/* 优化进度 */}
        {optimizeLoading && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
            {optimizeSteps.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                {i < currentOptStep ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : i === currentOptStep ? (
                  <Loader2 className="h-5 w-5 animate-spin text-black" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-zinc-200" />
                )}
                <span className={`text-sm ${i <= currentOptStep ? "text-black font-medium" : "text-zinc-400"}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 优化结果 */}
        {optimizeResults && (
          <div className="space-y-4">
            {/* SEO 结果 */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-black flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> SEO 审计修复
                </h3>
                {optimizeResults.seo?.score && (
                  <span className="rounded-full bg-green-100 px-3 py-0.5 text-xs font-bold text-green-700">评分 {optimizeResults.seo.score}</span>
                )}
              </div>
              {optimizeResults.seo?.title && (
                <div className="space-y-1 text-sm text-zinc-600">
                  <p><span className="text-zinc-400">Meta Title：</span>{optimizeResults.seo.title}</p>
                  <p><span className="text-zinc-400">Meta Description：</span>{optimizeResults.seo.description}</p>
                </div>
              )}
              {optimizeResults.seo?.error && <p className="text-sm text-red-500">{optimizeResults.seo.error}</p>}
            </div>

            {/* AEO 结果 */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-black flex items-center gap-2">
                  <FileText className="h-4 w-4" /> AEO 结构化
                </h3>
                {optimizeResults.aeo?.schema_generated && (
                  <span className="rounded-full bg-green-100 px-3 py-0.5 text-xs font-bold text-green-700">
                    FAQPage Schema ({optimizeResults.aeo.faq_count} Q&A)
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-500">FAQPage JSON-LD Schema 已就绪，帮助 AI 提取直接答案。</p>
              <button onClick={() => setShowSchema(!showSchema)} className="inline-flex items-center gap-1 mt-2 text-xs text-zinc-400 hover:text-black">
                <Eye className="h-3 w-3" />{showSchema ? "收起" : "查看 Schema 预览"}
              </button>
              {showSchema && (
                <pre className="mt-2 rounded-lg bg-zinc-900 p-4 text-xs text-green-400 overflow-x-auto max-h-48">
{`{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "用户常见问题",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "AI 生成的简要回答"
      }
    }
  ]
}`}
                </pre>
              )}
              {optimizeResults.aeo?.error && <p className="text-sm text-red-500">{optimizeResults.aeo.error}</p>}
            </div>

            {/* GEO 结果 */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-black flex items-center gap-2">
                  <Globe className="h-4 w-4" /> GEO 引擎适配
                </h3>
                {optimizeResults.geo?.framework && (
                  <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-bold text-blue-700">{optimizeResults.geo.framework}</span>
                )}
              </div>
              {optimizeResults.geo?.title && (
                <div className="space-y-1 text-sm text-zinc-600">
                  <p><span className="text-zinc-400">引擎标题：</span>{optimizeResults.geo.title}</p>
                  <p><span className="text-zinc-400">GEO 摘要：</span>{optimizeResults.geo.summary}</p>
                </div>
              )}
              <p className="text-xs text-zinc-400 mt-2">5 引擎追踪：ChatGPT / Claude / Perplexity / Gemini / Bing</p>
              {optimizeResults.geo?.error && <p className="text-sm text-red-500">{optimizeResults.geo.error}</p>}
            </div>

            {/* llms.txt */}
            {optimizeResults.llms_txt && (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <h3 className="text-sm font-semibold text-black mb-1">llms.txt 片段</h3>
                <pre className="text-xs text-zinc-500 whitespace-pre-wrap max-h-32 overflow-y-auto">{optimizeResults.llms_txt}</pre>
              </div>
            )}

            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              进入发布与监测
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderStep4Publish() {
    return (
      <div className="max-w-3xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-black mb-1">衡量"被引用"，而非仅"被点击"</h2>
          <p className="text-sm text-zinc-500">发布内容，并统一监测 SEO/AEO/GEO 多维效果指标。</p>
        </div>

        {/* 发布区 */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-black mb-3">
            {publishResult ? "已发布" : savedContentId ? "内容就绪，可以发布" : "尚未保存内容"}
          </h3>
          {savedContentId && !publishResult && (
            <>
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3 text-sm">
                  <FileText className="h-4 w-4 text-zinc-400" />
                  <span className="text-zinc-600">{contentTitle || "未命名内容"}</span>
                </div>
                {optimizeResults && (
                  <div className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-zinc-600">SEO/AEO/GEO 优化已完成</span>
                  </div>
                )}
              </div>

              {/* 发布渠道 + URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">发布渠道</label>
                  <select
                    value={publishForm.platform}
                    onChange={(e) => setPublishForm({ ...publishForm, platform: e.target.value })}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  >
                    {Object.entries(PLATFORM_OPTIONS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">发布链接</label>
                  <input
                    type="url"
                    value={publishForm.url}
                    onChange={(e) => setPublishForm({ ...publishForm, url: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-zinc-500 mb-1">备注</label>
                <input
                  value={publishForm.notes}
                  onChange={(e) => setPublishForm({ ...publishForm, notes: e.target.value })}
                  placeholder="发布说明（可选）"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <button
                onClick={handlePublish}
                disabled={publishLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {publishLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                发布内容
              </button>
            </>
          )}

          {/* 发布成功结果 */}
          {publishResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-zinc-600">{contentTitle || "未命名内容"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-zinc-400">渠道：</span>
                <span className="font-medium text-black">{PLATFORM_OPTIONS[publishResult.platform] || publishResult.platform}</span>
              </div>
              {publishResult.url && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-zinc-400">链接：</span>
                  <a
                    href={publishResult.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    {publishResult.url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              <Link
                href="/content"
                className="inline-flex items-center gap-1 mt-2 text-xs text-zinc-400 hover:text-black transition-colors"
              >
                查看所有发布记录 →
              </Link>
            </div>
          )}
        </div>

        {/* 统一效果看板 */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-black">统一效果看板</h3>
            {savedContentId && (
              <button
                onClick={() => fetchAnalytics(savedContentId)}
                disabled={analyticsLoading}
                className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-black transition-colors"
              >
                {analyticsLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <span>刷新数据</span>}
              </button>
            )}
          </div>

          {/* 互动指标 */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
            {[
              { label: "浏览", value: analytics?.views, icon: "👁", color: "text-blue-600" },
              { label: "点击", value: analytics?.clicks, icon: "👆", color: "text-indigo-600" },
              { label: "点赞", value: analytics?.likes, icon: "👍", color: "text-green-600" },
              { label: "评论", value: analytics?.comments, icon: "💬", color: "text-purple-600" },
              { label: "分享", value: analytics?.shares, icon: "📤", color: "text-orange-600" },
              { label: "互动分", value: analytics?.engagement, icon: "⭐", color: "text-amber-600" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-center">
                <div className="text-lg mb-0.5">{s.icon}</div>
                <div className={`text-xl font-bold ${s.color}`}>
                  {analytics ? (s.value ?? 0) : "—"}
                </div>
                <div className="text-xs text-zinc-400">{s.label}</div>
              </div>
            ))}
          </div>

          {/* 质量评分行 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-center">
              <div className="text-xs text-zinc-400 mb-0.5">SEO 评分</div>
              <div className="text-lg font-bold text-blue-600">
                {analytics?.seo_score || optimizeResults?.seo?.score || "—"}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-center">
              <div className="text-xs text-zinc-400 mb-0.5">AEO 评分</div>
              <div className="text-lg font-bold text-purple-600">
                {analytics?.aeo_score || "—"}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-center">
              <div className="text-xs text-zinc-400 mb-0.5">Schema</div>
              <div className="text-sm font-medium text-black mt-1">
                {optimizeResults?.aeo?.schema_generated ? "已部署" : "—"}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-center">
              <div className="text-xs text-zinc-400 mb-0.5">发布状态</div>
              <div className={`text-sm font-medium mt-1 ${publishResult ? "text-green-600" : "text-zinc-400"}`}>
                {publishResult ? "已发布" : "未发布"}
              </div>
            </div>
          </div>

          {/* 追踪代码 */}
          {publishResult && analytics?.track_view_url && (
            <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4 mb-4">
              <h4 className="text-xs font-semibold text-zinc-500 mb-2">追踪代码</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-zinc-400 mb-1">浏览追踪（嵌入发布页面的 &lt;img&gt; 标签）：</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-zinc-200 px-3 py-1.5 text-xs text-zinc-700 font-mono break-all">
                      {`<img src="${analytics.track_view_url}" width="1" height="1" alt="" />`}
                    </code>
                    <button
                      onClick={() => { navigator.clipboard.writeText(`<img src="${analytics.track_view_url}" width="1" height="1" alt="" />`); toast.success("已复制"); }}
                      className="shrink-0 rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-200 transition-colors"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 mb-1">点击追踪链接（替换原链接，统计后自动跳转）：</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-zinc-200 px-3 py-1.5 text-xs text-zinc-700 font-mono break-all">
                      {analytics.track_view_url.replace("/view", "/click")}?url=你的目标链接
                    </code>
                    <button
                      onClick={() => { navigator.clipboard.writeText(analytics.track_view_url!.replace("/view", "/click") + "?url=你的目标链接"); toast.success("已复制"); }}
                      className="shrink-0 rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-200 transition-colors"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!publishResult && !optimizeResults && (
            <p className="text-xs text-zinc-400 text-center">
              完成「优化」并「发布」后，此处展示效果数据与追踪代码
            </p>
          )}
        </div>

        {/* 快捷入口 */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-black mb-4">查看详细数据</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/content"
              className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-sm hover:bg-zinc-100 transition-colors"
            >
              <FileText className="h-5 w-5 text-zinc-500" />
              <div>
                <p className="font-medium text-black">内容工坊</p>
                <p className="text-xs text-zinc-400">发布记录 & 内容分析</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-zinc-300 ml-auto" />
            </Link>
            <Link
              href="/growth"
              className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-sm hover:bg-zinc-100 transition-colors"
            >
              <BarChart3 className="h-5 w-5 text-zinc-500" />
              <div>
                <p className="font-medium text-black">增长系统</p>
                <p className="text-xs text-zinc-400">SEO/AEO 优化详情</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-zinc-300 ml-auto" />
            </Link>
            <Link
              href="/analytics"
              className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-sm hover:bg-zinc-100 transition-colors"
            >
              <Globe className="h-5 w-5 text-zinc-500" />
              <div>
                <p className="font-medium text-black">数据分析</p>
                <p className="text-xs text-zinc-400">互动排行 & 趋势</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-zinc-300 ml-auto" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-black">智能内容中心</h1>
        <p className="text-sm text-zinc-500 mt-1">策划 → 创作 → 优化 → 发布&监测，SEO/AEO/GEO 三位一体</p>
      </div>

      {renderStepIndicator()}

      {step === 0 && renderStep1Plan()}
      {step === 1 && renderStep2Create()}
      {step === 2 && renderStep3Optimize()}
      {step === 3 && renderStep4Publish()}

      <Toaster position="top-center" richColors />
    </div>
  );
}
