"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

/* ========== 类型 ========== */

interface ProblemMapItem {
  funnel: string;
  persona: string;
  question: string;
  impact: string;
}

interface DistributionChannel {
  name: string;
  type: "primary" | "secondary";
  content_types: string[];
  description: string;
}

interface ContentBrief {
  id: string;
  pillar_id: string;
  title: string;
  description: string;
  content_type: string;
  funnel_stage: string;
  intent: string;
  target_persona: string;
  priority_question: string;
  evidence_count: number;
  primary_channel: string;
  secondary_channel: string;
  evidence_refs: { id: string; content: string }[];
  status: string;
  generated_content: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  cluster_name?: string;
  pillar_name?: string;
}

interface Evidence {
  id: string;
  content: string;
  source: string;
  source_type: string;
}

interface ContentPillar {
  id: string;
  cluster_id: string;
  name: string;
  intent_type: string;
  description: string;
  questions: ProblemMapItem[];
  priority_personas: string[];
  primary_channels: string[];
  secondary_channels: string[];
  evidence_required: number;
  sort_order: number;
  status: string;
  briefs?: ContentBrief[];
  evidence?: Evidence[];
}

interface TopicCluster {
  id: string;
  name: string;
  company_name: string;
  company_context: string;
  buyer_context: string;
  problem_map: ProblemMapItem[];
  distribution_channels: DistributionChannel[];
  status: string;
  created_at: string;
  updated_at: string;
  pillars?: ContentPillar[];
}

/* ========== 常量 ========== */

const FUNNEL_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  TOFU: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  MOFU: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  BOFU: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" },
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  BuyingGuide: "购买指南", CaseStudy: "案例研究", FAQ: "常见问题", Comparison: "对比分析",
  TechnicalDoc: "技术文档", UseCasePage: "场景页", QnA: "问答", KnowledgeBase: "知识库",
  Checklist: "清单", Whitepaper: "白皮书",
};

const INTENT_LABELS: Record<string, string> = {
  informational: "信息型", commercial: "商业型", transactional: "交易型",
};

const CHANNEL_ICONS: Record<string, string> = {
  primary: "🟢", secondary: "🟡",
};

/* ========== 子导航 ========== */

const SUB_NAV = [
  { key: "clusters", label: "主题集群", icon: "🔗" },
  { key: "briefs", label: "内容简报", icon: "📋" },
  { key: "content_lib", label: "内容库", icon: "📚" },
  { key: "publish", label: "发布策略", icon: "🚀" },
  { key: "seo", label: "SEO/AEO 优化", icon: "🎯" },
  { key: "geo", label: "GEO 发布中心", icon: "🌍", badge: "NEW" },
];

/* ========== 主页面 ========== */

export default function GrowthPage() {
  const [activeTab, setActiveTab] = useState("clusters");

  // 主题集群状态
  const [clusters, setClusters] = useState<TopicCluster[]>([]);
  const [loadingClusters, setLoadingClusters] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<TopicCluster | null>(null);
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  // 新建集群
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ company_name: "", company_description: "", industry: "", target_markets: "" });
  const [creating, setCreating] = useState(false);

  // 生成状态
  const [generatingBriefs, setGeneratingBriefs] = useState<string | null>(null);
  const [generatingEvidence, setGeneratingEvidence] = useState<string | null>(null);
  const [generatingContent, setGeneratingContent] = useState<string | null>(null);
  const [viewContent, setViewContent] = useState<{ title: string; content: string } | null>(null);

  // SEO/AEO 状态
  const [seoData, setSeoData] = useState<{
    items: SeoAuditItem[];
    stats: { total: number; avgSEO: number; avgAEO: number; withSchema: number; withGeo: number; lowScore: number };
  } | null>(null);
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoScanning, setSeoScanning] = useState(false);
  const [seoSearch, setSeoSearch] = useState("");
  const [seoSort, setSeoSort] = useState("seo_score");
  const [seoMinScore, setSeoMinScore] = useState(0);
  const [expandedAudit, setExpandedAudit] = useState<string | null>(null);
  const [fixingSeo, setFixingSeo] = useState<string | null>(null);
  const [fixingAeo, setFixingAeo] = useState<string | null>(null);

  interface SeoAuditItem {
    id: string;
    content_id: string;
    seo_score: number;
    aeo_score: number;
    title_score: number;
    meta_description_score: number;
    content_structure_score: number;
    keyword_usage_score: number;
    readability_score: number;
    internal_links_score: number;
    has_schema: boolean;
    has_geo: boolean;
    has_faq: boolean;
    issues: string[];
    recommendations: string[];
    word_count: number;
    title: string;
    content_body?: string;
    status: string;
    tags: string[];
    language: string;
    meta_title?: string;
    meta_description?: string;
    main_keyword?: string;
    keyword_in_title?: boolean;
    keyword_in_content?: boolean;
    has_faq_section?: boolean;
    has_conclusion?: boolean;
    meta_title_score?: number;
    word_count_score?: number;
    keyword_score?: number;
    faq_score?: number;
    geo_score?: number;
    aeo_details?: Record<string, { status: string; impact?: string; suggestion?: string }>;
  }

  /* ========== 数据加载 ========== */

  const loadClusters = useCallback(async () => {
    setLoadingClusters(true);
    try {
      const res = await fetch("/api/growth/clusters");
      const json = await res.json();
      if (json.data) setClusters(json.data);
    } catch { toast.error("加载集群失败"); }
    finally { setLoadingClusters(false); }
  }, []);

  useEffect(() => {
    if (activeTab === "clusters") loadClusters();
  }, [activeTab, loadClusters]);

  const loadClusterDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/growth/clusters/${id}`);
      const json = await res.json();
      if (json.data) setSelectedCluster(json.data);
      else toast.error("加载详情失败");
    } catch { toast.error("加载详情失败"); }
  };

  /* ========== 操作 ========== */

  const handleCreate = async () => {
    if (!createForm.company_name.trim()) return toast.error("请输入公司名称");
    setCreating(true);
    try {
      const res = await fetch("/api/growth/clusters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const json = await res.json();
      if (json.data) {
        toast.success(`集群已创建：${json.data.pillars} 个支柱，${json.data.briefs} 个简报`);
        setShowCreate(false);
        setCreateForm({ company_name: "", company_description: "", industry: "", target_markets: "" });
        loadClusters();
      } else {
        toast.error(json.error || "创建失败");
      }
    } catch { toast.error("创建失败"); }
    finally { setCreating(false); }
  };

  const handleGenerateBriefs = async (pillarId: string) => {
    setGeneratingBriefs(pillarId);
    try {
      const res = await fetch(`/api/growth/pillars/${pillarId}?action=generate-briefs`, { method: "POST" });
      const json = await res.json();
      if (json.data) {
        toast.success(`生成了 ${json.data.generated} 个简报`);
        if (selectedCluster) loadClusterDetail(selectedCluster.id);
      } else {
        toast.error(json.error || "生成失败");
      }
    } catch { toast.error("生成失败"); }
    finally { setGeneratingBriefs(null); }
  };

  const handleGenerateEvidence = async (pillarId: string) => {
    setGeneratingEvidence(pillarId);
    try {
      const res = await fetch(`/api/growth/pillars/${pillarId}?action=generate-evidence`, { method: "POST" });
      const json = await res.json();
      if (json.data) {
        toast.success(`生成了 ${json.data.generated} 条证据`);
        if (selectedCluster) loadClusterDetail(selectedCluster.id);
      } else {
        toast.error(json.error || "生成失败");
      }
    } catch { toast.error("生成失败"); }
    finally { setGeneratingEvidence(null); }
  };

  const handleGenerateContent = async (briefId: string) => {
    setGeneratingContent(briefId);
    try {
      const res = await fetch(`/api/growth/briefs/${briefId}?action=generate`, { method: "POST" });
      const json = await res.json();
      if (json.data) {
        toast.success("内容已生成");
        setViewContent({ title: json.data.content.split("\n")[0]?.replace(/^#+\s*/, "") || "内容", content: json.data.content });
        if (selectedCluster) loadClusterDetail(selectedCluster.id);
      } else {
        toast.error(json.error || "生成失败");
      }
    } catch { toast.error("生成失败"); }
    finally { setGeneratingContent(null); }
  };

  /* ========== 渲染：主题集群 ========== */

  function renderClusters() {
    if (selectedCluster) return renderClusterDetail();
    return renderClusterList();
  }

  function renderClusterList() {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-black">主题集群</h2>
            <p className="text-sm text-zinc-500 mt-1">构建 TOFU → MOFU → BOFU 全漏斗内容规划</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-xl bg-black px-4 py-2 text-sm text-white hover:bg-zinc-800 transition-colors"
          >
            + 新建集群
          </button>
        </div>

        {/* 新建表单 */}
        {showCreate && (
          <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-6">
            <h3 className="font-semibold text-sm mb-4">AI 生成主题集群</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <input
                value={createForm.company_name}
                onChange={(e) => setCreateForm({ ...createForm, company_name: e.target.value })}
                placeholder="公司名称 *"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
              <input
                value={createForm.industry}
                onChange={(e) => setCreateForm({ ...createForm, industry: e.target.value })}
                placeholder="所属行业"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
              <input
                value={createForm.company_description}
                onChange={(e) => setCreateForm({ ...createForm, company_description: e.target.value })}
                placeholder="公司描述（一句话）"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none sm:col-span-2"
              />
              <input
                value={createForm.target_markets}
                onChange={(e) => setCreateForm({ ...createForm, target_markets: e.target.value })}
                placeholder="目标市场"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none sm:col-span-2"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={creating}
                className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {creating ? "AI 分析中..." : "开始分析"}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 集群列表 */}
        {loadingClusters ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-24 rounded-xl bg-zinc-100 animate-pulse" />)}
          </div>
        ) : clusters.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 py-16 text-center">
            <p className="text-sm text-zinc-400">暂无主题集群</p>
            <p className="text-xs text-zinc-300 mt-1">输入目标客户的公司信息，AI 将自动生成完整的主题集群分析</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clusters.map((c) => (
              <div
                key={c.id}
                onClick={() => { setSelectedCluster(c); loadClusterDetail(c.id); }}
                className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-300 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-black">{c.company_name || c.name}</h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      {c.pillars?.length || 0} 个内容支柱 · {c.pillars?.reduce((s, p) => s + (p.briefs?.length || 0), 0) || 0} 个内容规划
                    </p>
                  </div>
                  <span className="text-xs text-zinc-400">{new Date(c.created_at).toLocaleDateString("zh-CN")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderClusterDetail() {
    const c = selectedCluster;
    if (!c) return null;

    return (
      <div>
        {/* 返回按钮 */}
        <button
          onClick={() => { setSelectedCluster(null); loadClusters(); }}
          className="text-sm text-zinc-500 hover:text-black mb-4 flex items-center gap-1"
        >
          ← 返回集群列表
        </button>

        {/* 标题 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-black">{c.company_name || c.name}</h2>
            <p className="text-sm text-zinc-500 mt-1">
              {c.pillars?.length || 0} 个内容支柱 · {c.pillars?.reduce((s, p) => s + (p.briefs?.length || 0), 0) || 0} 个内容规划
            </p>
          </div>
        </div>

        {/* 公司上下文 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {c.company_context && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
              <h4 className="text-xs font-bold text-blue-700 uppercase mb-2">客户认知</h4>
              <p className="text-sm text-blue-900 leading-relaxed">{c.company_context}</p>
            </div>
          )}
          {c.buyer_context && (
            <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4">
              <h4 className="text-xs font-bold text-purple-700 uppercase mb-2">目标买家认知</h4>
              <p className="text-sm text-purple-900 leading-relaxed">{c.buyer_context}</p>
            </div>
          )}
        </div>

        {/* 全局问题地图 */}
        {c.problem_map?.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-bold text-zinc-500 uppercase mb-3">全局问题地图</h4>
            <div className="space-y-2">
              {c.problem_map.map((item, i) => {
                const colors = FUNNEL_COLORS[item.funnel] || FUNNEL_COLORS.TOFU;
                return (
                  <div key={i} className={`rounded-lg border ${colors.border} ${colors.bg} p-3`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${colors.text} bg-white`}>{item.funnel}</span>
                      <span className="text-xs text-zinc-500">{item.persona}</span>
                    </div>
                    <p className="text-sm font-medium text-zinc-800">{item.question}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{item.impact}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 发布渠道 */}
        {c.distribution_channels?.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-bold text-zinc-500 uppercase mb-3">建议发布方向</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {c.distribution_channels.map((ch, i) => (
                <div key={i} className={`rounded-lg border p-3 ${ch.type === "primary" ? "border-green-200 bg-green-50/50" : "border-amber-200 bg-amber-50/50"}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs">{CHANNEL_ICONS[ch.type]}</span>
                    <span className="text-xs font-semibold text-zinc-700">{ch.name}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-2">{ch.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {ch.content_types.map((ct) => (
                      <span key={ct} className="text-[10px] px-1.5 py-0.5 rounded bg-white border text-zinc-500">
                        {CONTENT_TYPE_LABELS[ct] || ct}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 内容支柱 */}
        <div>
          <h4 className="text-xs font-bold text-zinc-500 uppercase mb-3">内容支柱</h4>
          <div className="space-y-4">
            {c.pillars?.map((pillar) => {
              const isExpanded = expandedPillar === pillar.id;
              const evidenceCount = pillar.evidence?.length || 0;
              return (
                <div key={pillar.id} className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                  {/* 支柱头部 */}
                  <div
                    onClick={() => setExpandedPillar(isExpanded ? null : pillar.id)}
                    className="p-4 cursor-pointer hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-black">{pillar.name}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500">
                            {INTENT_LABELS[pillar.intent_type] || pillar.intent_type}
                          </span>
                          <span className="text-xs text-zinc-400">· {pillar.briefs?.length || 0} 个内容</span>
                        </div>
                        {pillar.description && (
                          <p className="text-xs text-zinc-500 line-clamp-1">{pillar.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-zinc-400">{isExpanded ? "收起 ↑" : "展开 ↓"}</span>
                    </div>

                    {/* 优先角色 */}
                    {pillar.priority_personas?.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="text-[10px] text-zinc-400">优先服务角色:</span>
                        {pillar.priority_personas.map((p) => (
                          <span key={p} className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600">{p}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 支柱展开内容 */}
                  {isExpanded && (
                    <div className="border-t border-zinc-100 px-4 py-4 bg-zinc-50/50 space-y-4">
                      {/* 关键问题 */}
                      {pillar.questions?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-zinc-600 mb-2">此支柱重点回答的问题</p>
                          <div className="space-y-1.5">
                            {pillar.questions.map((q, i) => {
                              const colors = FUNNEL_COLORS[q.funnel] || FUNNEL_COLORS.TOFU;
                              return (
                                <div key={i} className={`rounded border-l-2 ${colors.border} ${colors.bg} p-2`}>
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className={`text-[10px] font-bold ${colors.text}`}>{q.funnel}</span>
                                    <span className="text-[10px] text-zinc-500">{q.persona}</span>
                                  </div>
                                  <p className="text-xs text-zinc-700">{q.question}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 证据库 */}
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-zinc-600">
                          此支柱需要 {pillar.evidence_required} 条证据支撑
                          {evidenceCount > 0 && <span className="text-green-600 ml-1">({evidenceCount} 条已收集)</span>}
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleGenerateEvidence(pillar.id); }}
                          disabled={generatingEvidence === pillar.id}
                          className="text-xs bg-zinc-200 text-zinc-700 px-2 py-1 rounded hover:bg-zinc-300 disabled:opacity-50"
                        >
                          {generatingEvidence === pillar.id ? "生成中..." : evidenceCount > 0 ? "补充证据" : "生成证据"}
                        </button>
                      </div>
                      {pillar.evidence?.map((ev, i) => (
                        <div key={i} className="rounded border border-zinc-200 bg-white p-2 text-xs text-zinc-600">
                          {ev.content}
                          {ev.source && <span className="text-zinc-400 ml-1">— {ev.source}</span>}
                        </div>
                      ))}

                      {/* 简报卡片 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-zinc-600">内容简报</p>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleGenerateBriefs(pillar.id); }}
                            disabled={generatingBriefs === pillar.id}
                            className="text-xs bg-black text-white px-2 py-1 rounded hover:bg-zinc-800 disabled:opacity-50"
                          >
                            {generatingBriefs === pillar.id ? "生成中..." : "+ 生成简报"}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {pillar.briefs?.map((brief) => {
                            const fColors = FUNNEL_COLORS[brief.funnel_stage] || FUNNEL_COLORS.TOFU;
                            return (
                              <div key={brief.id} className={`rounded-lg border ${fColors.border} bg-white p-3 hover:shadow-sm transition-shadow`}>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${fColors.text} ${fColors.bg}`}>
                                    {brief.funnel_stage}
                                  </span>
                                  <span className="text-[10px] text-zinc-400">{INTENT_LABELS[brief.intent] || brief.intent}</span>
                                </div>
                                <p className="text-sm font-medium text-black mb-1">{brief.title}</p>
                                <p className="text-xs text-zinc-500 line-clamp-2 mb-2">{brief.description}</p>
                                <div className="text-[10px] text-zinc-400 space-y-0.5 mb-2">
                                  <p>面向角色：{brief.target_persona}</p>
                                  <p>优先回答：{brief.priority_question?.substring(0, 40)}{(brief.priority_question?.length || 0) > 40 ? "..." : ""}</p>
                                  {brief.evidence_count > 0 && <p>引用 {brief.evidence_count} 条证据</p>}
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500">
                                    {CONTENT_TYPE_LABELS[brief.content_type] || brief.content_type}
                                  </span>
                                  {brief.status === "generated" ? (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setViewContent({ title: brief.title, content: brief.generated_content }); }}
                                      className="text-[10px] text-green-600 font-medium hover:underline"
                                    >
                                      查看内容
                                    </button>
                                  ) : (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleGenerateContent(brief.id); }}
                                      disabled={generatingContent === brief.id}
                                      className="text-[10px] bg-zinc-900 text-white px-2 py-1 rounded hover:bg-zinc-800 disabled:opacity-50"
                                    >
                                      {generatingContent === brief.id ? "..." : "生成内容"}
                                    </button>
                                  )}
                                </div>
                                <p className="text-[10px] text-zinc-400 mt-1.5 truncate">
                                  主发布：{brief.primary_channel}
                                </p>
                              </div>
                            );
                          })}
                          {(!pillar.briefs || pillar.briefs.length === 0) && (
                            <p className="text-xs text-zinc-400 col-span-full py-4 text-center">暂无内容简报，点击"生成简报"</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {(!c.pillars || c.pillars.length === 0) && (
              <p className="text-xs text-zinc-400 text-center py-8">暂无内容支柱</p>
            )}
          </div>
        </div>

        {/* 内容查看弹窗 */}
        {viewContent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setViewContent(null)}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4 p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">{viewContent.title}</h3>
                <button onClick={() => setViewContent(null)} className="text-zinc-400 hover:text-black text-xl">×</button>
              </div>
              <div className="prose prose-sm max-w-none text-zinc-700 whitespace-pre-wrap leading-relaxed">
                {viewContent.content}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ========== SEO/AEO 数据加载 ========== */

  const loadSEOData = useCallback(async () => {
    setSeoLoading(true);
    try {
      const params = new URLSearchParams();
      if (seoSearch) params.set("search", seoSearch);
      params.set("sort", seoSort);
      if (seoMinScore > 0) params.set("min_score", String(seoMinScore));
      const res = await fetch(`/api/seo/audits?${params}`);
      const json = await res.json();
      if (json.data) setSeoData(json.data);
    } catch { toast.error("加载SEO数据失败"); }
    finally { setSeoLoading(false); }
  }, [seoSearch, seoSort, seoMinScore]);

  useEffect(() => {
    if (activeTab === "seo") loadSEOData();
  }, [activeTab, loadSEOData]);

  const handleBatchScan = async () => {
    setSeoScanning(true);
    try {
      const res = await fetch("/api/seo/audits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const json = await res.json();
      if (json.data) {
        toast.success(`已扫描 ${json.data.scanned} 条内容`);
        loadSEOData();
      } else {
        toast.error(json.error || "扫描失败");
      }
    } catch { toast.error("扫描失败"); }
    finally { setSeoScanning(false); }
  };

  function getScoreColor(score: number) {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-red-600 bg-red-50 border-red-200";
  }

  function getScoreBadge(score: number) {
    if (score >= 80) return "bg-green-100 text-green-700";
    if (score >= 60) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  }

  /* ========== 渲染：SEO/AEO 工作台 ========== */

  function renderSEO() {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-black">SEO / AEO 工作台</h2>
            <p className="text-sm text-zinc-500 mt-1">内容质量检测 · Meta 合规 · FAQPage Schema · AI 引擎可见性</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchScan}
              disabled={seoScanning}
              className="rounded-xl bg-black px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {seoScanning ? "扫描中..." : "批量扫描保存"}
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        {seoData?.stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <div className="bg-white border rounded-xl p-4">
              <p className="text-xs text-zinc-400 mb-1">{seoData.stats.total} 条内容</p>
              <p className="text-2xl font-bold">{seoLoading ? "..." : seoData.items.length}</p>
            </div>
            <div className="bg-white border rounded-xl p-4">
              <p className="text-xs text-zinc-400 mb-1">平均 SEO 分</p>
              <p className={`text-2xl font-bold ${seoData.stats.avgSEO >= 80 ? "text-green-600" : seoData.stats.avgSEO >= 60 ? "text-amber-600" : "text-red-600"}`}>
                {seoData.stats.avgSEO}
              </p>
            </div>
            <div className="bg-white border rounded-xl p-4">
              <p className="text-xs text-zinc-400 mb-1">平均 AEO 分</p>
              <p className={`text-2xl font-bold ${seoData.stats.avgAEO >= 80 ? "text-green-600" : seoData.stats.avgAEO >= 60 ? "text-amber-600" : "text-red-600"}`}>
                {seoData.stats.avgAEO}
              </p>
            </div>
            <div className="bg-white border rounded-xl p-4">
              <p className="text-xs text-zinc-400 mb-1">有 Schema</p>
              <p className="text-2xl font-bold text-purple-600">{seoData.stats.withSchema}</p>
            </div>
            <div className="bg-white border rounded-xl p-4">
              <p className="text-xs text-zinc-400 mb-1">有 GEO 版本</p>
              <p className="text-2xl font-bold text-blue-600">{seoData.stats.withGeo}</p>
            </div>
            <div className="bg-white border rounded-xl p-4">
              <p className="text-xs text-zinc-400 mb-1">问题内容 (&lt;60)</p>
              <p className={`text-2xl font-bold ${seoData.stats.lowScore > 0 ? "text-red-600" : "text-green-600"}`}>
                {seoData.stats.lowScore}
              </p>
            </div>
          </div>
        )}

        {/* 搜索和筛选 */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <input
            type="text"
            value={seoSearch}
            onChange={(e) => setSeoSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") loadSEOData(); }}
            placeholder="搜索标题、关键词..."
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-black w-56"
          />
          <select value={seoSort} onChange={(e) => setSeoSort(e.target.value)} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none">
            <option value="seo_score">SEO 分 ↑ 最低优先</option>
            <option value="aeo_score">AEO 分 ↑ 最低优先</option>
          </select>
          <div className="flex items-center gap-1.5">
            {[
              [0, "全部内容"],
              [80, "≥80 优秀"],
              [60, "60–79 良好"],
              [1, "<60 需改进"],
            ].map(([val, label]) => (
              <button
                key={val as number}
                onClick={() => setSeoMinScore(val as number)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                  seoMinScore === val
                    ? "bg-black text-white border-black"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {label as string}
              </button>
            ))}
          </div>
          {seoMinScore === 1 && (
            <span className="text-xs text-zinc-400">正在筛选 &lt;60 分</span>
          )}
          <span className="text-xs text-zinc-400 ml-auto">点击行展开检查详情</span>
        </div>

        {/* 内容列表 */}
        {seoLoading ? (
          <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-16 rounded-xl bg-zinc-100 animate-pulse" />)}</div>
        ) : !seoData?.items.length ? (
          <div className="rounded-xl border border-dashed border-zinc-300 py-16 text-center">
            <p className="text-sm text-zinc-400">暂无 SEO 审计数据</p>
            <p className="text-xs text-zinc-300 mt-1">点击"批量扫描保存"对现有内容进行 SEO/AEO 分析</p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* 表头 */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-zinc-400">
              <span className="col-span-1">SEO</span>
              <span className="col-span-1">AEO</span>
              <span className="col-span-4">标题</span>
              <span className="col-span-1">状态</span>
              <span className="col-span-1 text-right">字数</span>
              <span className="col-span-4 text-center">标记</span>
            </div>
            {seoData.items.map((item) => {
              const isExpanded = expandedAudit === item.id;
              const seoBadge = getScoreBadge(item.seo_score);
              const aeoBadge = getScoreBadge(item.aeo_score);
              const aeoDetails = item.aeo_details || {};
              const kw = item.main_keyword || (item.tags || [])[0] || "";

              return (
                <div key={item.id}>
                  {/* 行 */}
                  <div
                    onClick={() => setExpandedAudit(isExpanded ? null : item.id)}
                    className="grid grid-cols-12 gap-2 px-4 py-3 rounded-xl border border-zinc-100 bg-white hover:border-zinc-200 cursor-pointer transition-colors items-center"
                  >
                    <span className={`col-span-1 text-xs font-bold px-1.5 py-1 rounded text-center ${seoBadge}`}>
                      {item.seo_score}
                    </span>
                    <span className={`col-span-1 text-xs font-bold px-1.5 py-1 rounded text-center ${aeoBadge}`}>
                      {item.aeo_score}
                    </span>
                    <div className="col-span-4 min-w-0">
                      <p className="text-sm font-medium text-black truncate">{item.title || "未命名"}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{kw}</p>
                    </div>
                    <span className="col-span-1 text-xs text-zinc-500">{item.status || "draft"}</span>
                    <span className="col-span-1 text-xs text-zinc-400 text-right">{item.word_count?.toLocaleString()} 字</span>
                    <div className="col-span-4 flex items-center justify-end gap-1.5">
                      {item.has_schema && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-600">Schema</span>}
                      {item.has_geo && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">GEO</span>}
                      {item.has_faq && <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-600">FAQ</span>}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.aeo_score >= 10 ? "bg-green-100 text-green-600" : "bg-zinc-100 text-zinc-500"}`}>AEO</span>
                    </div>
                  </div>

                  {/* ===== 展开详情 ===== */}
                  {isExpanded && (
                    <div className="mx-2 mb-3 rounded-b-xl border border-t-0 border-zinc-200 bg-white p-5 space-y-5">
                      {/* SEO 检查项 */}
                      <div>
                        <p className="text-xs font-bold text-zinc-700 mb-3">SEO 检查项</p>
                        <div className="space-y-2">
                          {/* Meta Title */}
                          <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2.5">
                            <div>
                              <p className="text-sm font-medium text-black">Meta Title 长度 (30–60)</p>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                {item.meta_title ? `"${item.meta_title.substring(0, 60)}${(item.meta_title || "").length > 60 ? "..." : ""}"` : "未填写"}
                                {" · "}{item.meta_title?.length || 0} 字符
                              </p>
                            </div>
                            <span className={`text-sm font-bold ${(item.meta_title_score || 0) >= 15 ? "text-green-600" : (item.meta_title_score || 0) >= 5 ? "text-amber-600" : "text-red-500"}`}>
                              {item.meta_title_score || 0}/20
                            </span>
                          </div>
                          {/* Meta Description */}
                          <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2.5">
                            <div>
                              <p className="text-sm font-medium text-black">Meta Description 长度 (120–160)</p>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                {item.meta_description ? `"${item.meta_description.substring(0, 60)}..."` : "未填写"}
                                {" · "}{item.meta_description?.length || 0} 字符
                              </p>
                            </div>
                            <span className={`text-sm font-bold ${(item.meta_description_score || 0) >= 15 ? "text-green-600" : (item.meta_description_score || 0) >= 5 ? "text-amber-600" : "text-red-500"}`}>
                              {item.meta_description_score || 0}/20
                            </span>
                          </div>
                          {/* 字数 */}
                          <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2.5">
                            <div>
                              <p className="text-sm font-medium text-black">字数达标 (≥1500 字)</p>
                              <p className="text-xs text-zinc-400 mt-0.5">{item.word_count?.toLocaleString()} 字</p>
                            </div>
                            <span className={`text-sm font-bold ${(item.word_count_score || 0) >= 15 ? "text-green-600" : (item.word_count_score || 0) >= 5 ? "text-amber-600" : "text-red-500"}`}>
                              {item.word_count_score || 0}/20
                            </span>
                          </div>
                          {/* 关键词 */}
                          <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2.5">
                            <div>
                              <p className="text-sm font-medium text-black">主关键词出现 (内容+标题)</p>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                "{kw}" {item.keyword_in_title ? "✓标题" : "✗标题"} {item.keyword_in_content ? "✓正文" : "✗正文"}
                              </p>
                            </div>
                            <span className={`text-sm font-bold ${(item.keyword_score || 0) >= 12 ? "text-green-600" : (item.keyword_score || 0) >= 5 ? "text-amber-600" : "text-red-500"}`}>
                              {item.keyword_score || 0}/15
                            </span>
                          </div>
                          {/* FAQ Schema */}
                          <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2.5">
                            <div>
                              <p className="text-sm font-medium text-black">FAQPage JSON-LD</p>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                {item.has_schema ? "✓ 已生成" : "未生成"}
                              </p>
                            </div>
                            <span className={`text-sm font-bold ${item.has_schema ? "text-green-600" : "text-red-500"}`}>
                              {item.has_schema ? 15 : 0}/15
                            </span>
                          </div>
                          {/* GEO */}
                          <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2.5">
                            <div>
                              <p className="text-sm font-medium text-black">GEO 优化版本</p>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                {item.has_geo ? "✓ 已生成" : "未生成"}
                              </p>
                            </div>
                            <span className={`text-sm font-bold ${item.has_geo ? "text-green-600" : "text-red-500"}`}>
                              {item.has_geo ? 10 : 0}/10
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* AEO 结构检查 */}
                      <div>
                        <p className="text-xs font-bold text-zinc-700 mb-3">AEO 结构检查</p>
                        <div className="space-y-1.5">
                          {[
                            {
                              label: "FAQPage JSON-LD",
                              ok: !aeoDetails.faq_schema || aeoDetails.faq_schema.status === "ok",
                              impact: (aeoDetails.faq_schema as {impact?: string})?.impact || "缺失 — 影响 Rich Results",
                            },
                            {
                              label: "GEO 优化版本",
                              ok: !aeoDetails.geo_version || aeoDetails.geo_version.status === "ok",
                              impact: (aeoDetails.geo_version as {impact?: string})?.impact || "缺失 — AI 引擎无法引用",
                            },
                            {
                              label: "FAQ 内容区块",
                              ok: !aeoDetails.faq_section || aeoDetails.faq_section.status === "ok",
                              impact: (aeoDetails.faq_section as {suggestion?: string})?.suggestion || "建议追加 FAQ 段落",
                            },
                            {
                              label: "结论/总结段落",
                              ok: !aeoDetails.conclusion || aeoDetails.conclusion.status === "ok",
                              impact: (aeoDetails.conclusion as {suggestion?: string})?.suggestion || "建议追加结论段",
                            },
                          ].map((check) => (
                            <div key={check.label} className={`flex items-center gap-2 rounded-lg px-3 py-2 ${check.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                              <span className="text-xs">{check.ok ? "✓" : "✗"}</span>
                              <span className="text-xs font-medium">{check.label}</span>
                              {!check.ok && <span className="text-[10px] ml-auto">{check.impact}</span>}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center gap-2 border-t border-zinc-100 pt-4">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            setFixingSeo(item.id);
                            try {
                              const res = await fetch("/api/seo/audits/fix-seo", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ audit_id: item.id }),
                              });
                              const json = await res.json();
                              if (json.data) {
                                toast.success("SEO 已修复，Meta 信息已优化");
                                loadSEOData();
                              } else {
                                toast.error(json.error || "修复失败");
                              }
                            } catch { toast.error("修复失败"); }
                            finally { setFixingSeo(null); }
                          }}
                          disabled={fixingSeo === item.id}
                          className="rounded-lg bg-black px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                        >
                          {fixingSeo === item.id ? "修复中..." : "AI 修复 SEO"}
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            setFixingAeo(item.id);
                            try {
                              const res = await fetch("/api/seo/audits/fix-aeo", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ audit_id: item.id }),
                              });
                              const json = await res.json();
                              if (json.data) {
                                toast.success("GEO/AEO 已优化，Schema 和结构化内容已生成");
                                loadSEOData();
                              } else {
                                toast.error(json.error || "优化失败");
                              }
                            } catch { toast.error("优化失败"); }
                            finally { setFixingAeo(null); }
                          }}
                          disabled={fixingAeo === item.id}
                          className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                        >
                          {fixingAeo === item.id ? "优化中..." : "AI 优化 GEO"}
                        </button>
                        <a
                          href={`/contents/${item.content_id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="ml-auto text-xs text-zinc-400 hover:text-black underline"
                        >
                          前往编辑内容
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ========== 内容简报状态 ========== */

  const [allBriefs, setAllBriefs] = useState<ContentBrief[]>([]);
  const [briefsLoading, setBriefsLoading] = useState(false);
  const [briefsTotal, setBriefsTotal] = useState(0);
  const [briefsFilter, setBriefsFilter] = useState<{ status: string; funnel: string; search: string }>({ status: "", funnel: "", search: "" });

  const loadAllBriefs = useCallback(async () => {
    setBriefsLoading(true);
    try {
      const params = new URLSearchParams();
      if (briefsFilter.status) params.set("status", briefsFilter.status);
      if (briefsFilter.funnel) params.set("funnel", briefsFilter.funnel);
      if (briefsFilter.search) params.set("search", briefsFilter.search);
      const res = await fetch(`/api/growth/briefs?${params}`);
      const json = await res.json();
      if (json.data) { setAllBriefs(json.data); setBriefsTotal(json.total || json.data.length); }
    } catch { toast.error("加载简报失败"); }
    finally { setBriefsLoading(false); }
  }, [briefsFilter]);

  useEffect(() => {
    if (activeTab === "briefs") loadAllBriefs();
  }, [activeTab, loadAllBriefs]);

  /* ========== 发布策略状态 ========== */

  interface Schedule {
    id: string; title: string; channel: string; scheduled_date: string | null;
    status: string; notes: string; brief_id: string | null; published_at: string | null;
  }
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ title: "", channel: "", scheduled_date: "", notes: "" });

  const loadSchedules = useCallback(async () => {
    setSchedulesLoading(true);
    try {
      const res = await fetch("/api/growth/schedules");
      const json = await res.json();
      if (json.data) setSchedules(json.data);
    } catch { toast.error("加载排期失败"); }
    finally { setSchedulesLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === "publish") loadSchedules();
  }, [activeTab, loadSchedules]);

  const handleCreateSchedule = async () => {
    if (!scheduleForm.title.trim()) return toast.error("请输入内容标题");
    try {
      const res = await fetch("/api/growth/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleForm),
      });
      const json = await res.json();
      if (json.data) {
        toast.success("排期已创建");
        setShowScheduleForm(false);
        setScheduleForm({ title: "", channel: "", scheduled_date: "", notes: "" });
        loadSchedules();
      } else { toast.error(json.error || "创建失败"); }
    } catch { toast.error("创建失败"); }
  };

  const handleUpdateSchedule = async (id: string, updates: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/growth/schedules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      const json = await res.json();
      if (json.data) { toast.success("已更新"); loadSchedules(); }
      else { toast.error(json.error || "更新失败"); }
    } catch { toast.error("更新失败"); }
  };

  /* ========== GEO 状态 ========== */

  interface GeoVersion {
    id: string; source_content_id: string | null; content_id: string | null;
    language: string; title: string; content: string; geo_title: string;
    geo_summary: string; framework: string; word_count: number;
    source_type: string; source_title?: string; source_slug?: string;
    source_word_count?: number; engine_tracking: EngineTracking[];
    status: string; source: string; created_at: string;
  }
  interface EngineTracking { engine: string; label: string; status: string; checked_at: string; }
  interface GeoStats { total: number; avgWords: number; cited: number; channels: number; }

  const [geoVersions, setGeoVersions] = useState<GeoVersion[]>([]);
  const [geoStats, setGeoStats] = useState<GeoStats | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoSearch, setGeoSearch] = useState("");
  const [geoGenerating, setGeoGenerating] = useState(false);
  const [geoOptimizing, setGeoOptimizing] = useState<string | null>(null);
  const [geoPublishing, setGeoPublishing] = useState<string | null>(null);
  const [geoContentSelect, setGeoContentSelect] = useState("");
  const [availableContents, setAvailableContents] = useState<{ id: string; title: string; slug: string }[]>([]);

  const loadGeoVersions = useCallback(async () => {
    setGeoLoading(true);
    try {
      const params = new URLSearchParams();
      if (geoSearch) params.set("search", geoSearch);
      const res = await fetch(`/api/growth/geo?${params}`);
      const json = await res.json();
      if (json.data) { setGeoVersions(json.data.items); setGeoStats(json.data.stats); }
    } catch { toast.error("加载GEO失败"); }
    finally { setGeoLoading(false); }
  }, [geoSearch]);

  useEffect(() => {
    if (activeTab === "geo") { loadGeoVersions(); loadAvailableContents(); }
  }, [activeTab, loadGeoVersions]);

  const loadAvailableContents = async () => {
    try {
      const res = await fetch("/api/contents");
      const json = await res.json();
      if (json.data) setAvailableContents(json.data.filter((c: { status: string }) => c.status === "published" || c.status === "review"));
    } catch { /* silent */ }
  };

  const handleGenerateGeo = async () => {
    if (!geoContentSelect) return toast.error("请选择源内容");
    setGeoGenerating(true);
    try {
      const res = await fetch("/api/growth/geo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-geo", content_id: geoContentSelect }),
      });
      const json = await res.json();
      if (json.data) { toast.success("GEO 优化版本已生成"); loadGeoVersions(); }
      else { toast.error(json.error || "生成失败"); }
    } catch { toast.error("生成失败"); }
    finally { setGeoGenerating(false); }
  };

  const handleReoptimize = async (geoId: string) => {
    setGeoOptimizing(geoId);
    try {
      const res = await fetch("/api/growth/geo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reoptimize", id: geoId }),
      });
      const json = await res.json();
      if (json.data) { toast.success("已重新优化"); loadGeoVersions(); }
      else { toast.error(json.error || "失败"); }
    } catch { toast.error("优化失败"); }
    finally { setGeoOptimizing(null); }
  };

  const handlePublishGeo = async (geoId: string) => {
    setGeoPublishing(geoId);
    try {
      const res = await fetch("/api/growth/geo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish-geo", id: geoId }),
      });
      const json = await res.json();
      if (json.data) { toast.success("已发布 — 结构化数据已注入源内容"); loadGeoVersions(); }
      else { toast.error(json.error || "发布失败"); }
    } catch { toast.error("发布失败"); }
    finally { setGeoPublishing(null); }
  };

  const handleCopyGeo = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("已复制到剪贴板");
    } catch { toast.error("复制失败"); }
  };

  /* ========== 渲染：内容简报 ========== */

  function renderBriefs() {
    const generatedCount = allBriefs.filter(b => b.status === "generated").length;
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-black">内容简报</h2>
            <p className="text-sm text-zinc-500 mt-1">
              共 {briefsTotal} 条简报 · {generatedCount} 条已生成内容
            </p>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            ["全部", briefsTotal, "text-zinc-700", ""],
            ["已生成", generatedCount, "text-green-700", "generated"],
            ["草稿", briefsTotal - generatedCount, "text-amber-700", "draft"],
            ["TOFU", allBriefs.filter(b => b.funnel_stage === "TOFU").length, "text-blue-700", ""],
          ].map(([label, count, color, status]) => (
            <button
              key={label as string}
              onClick={() => setBriefsFilter(prev => ({ ...prev, status: (status as string) === briefsFilter.status ? "" : status as string }))}
              className={`rounded-xl border p-4 text-left transition-colors ${(status as string) && briefsFilter.status === status ? "border-black bg-zinc-50" : "border-zinc-200 bg-white hover:border-zinc-300"}`}
            >
              <p className="text-xs text-zinc-400 mb-1">{label as string}</p>
              <p className={`text-2xl font-bold ${color}`}>{count as number}</p>
            </button>
          ))}
        </div>

        {/* 筛选栏 */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <input
            type="text" value={briefsFilter.search} onChange={(e) => setBriefsFilter(prev => ({ ...prev, search: e.target.value }))}
            onKeyDown={(e) => { if (e.key === "Enter") loadAllBriefs(); }}
            placeholder="搜索标题、描述..." className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-black w-56"
          />
          <select value={briefsFilter.funnel} onChange={(e) => setBriefsFilter(prev => ({ ...prev, funnel: e.target.value }))} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none">
            <option value="">全部漏斗</option>
            <option value="TOFU">TOFU 上层</option>
            <option value="MOFU">MOFU 中层</option>
            <option value="BOFU">BOFU 下层</option>
          </select>
          <select value={briefsFilter.status} onChange={(e) => setBriefsFilter(prev => ({ ...prev, status: e.target.value }))} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none">
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="generated">已生成</option>
          </select>
          <button onClick={loadAllBriefs} className="rounded-lg bg-black px-3 py-1.5 text-xs text-white hover:bg-zinc-800">
            筛选
          </button>
        </div>

        {/* 简报列表 */}
        {briefsLoading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-zinc-100 animate-pulse" />)}</div>
        ) : allBriefs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 py-16 text-center">
            <p className="text-sm text-zinc-400">暂无内容简报</p>
            <p className="text-xs text-zinc-300 mt-1">在「主题集群」中创建集群并生成简报</p>
          </div>
        ) : (
          <div className="space-y-2">
            {allBriefs.map((brief) => {
              const fColors = FUNNEL_COLORS[brief.funnel_stage] || FUNNEL_COLORS.TOFU;
              return (
                <div key={brief.id} className={`rounded-xl border ${fColors.border} bg-white p-4 hover:shadow-sm transition-shadow`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${fColors.text} ${fColors.bg}`}>{brief.funnel_stage}</span>
                        <span className="text-sm font-semibold text-black truncate">{brief.title}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${brief.status === "generated" ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
                          {brief.status === "generated" ? "已生成" : "草稿"}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 line-clamp-1 mb-1.5">{brief.description}</p>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 flex-wrap">
                        <span>{CONTENT_TYPE_LABELS[brief.content_type] || brief.content_type}</span>
                        <span>·</span>
                        <span>{brief.target_persona}</span>
                        <span>·</span>
                        <span>{brief.cluster_name || brief.pillar_name}</span>
                        <span>·</span>
                        <span>{brief.primary_channel}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      {brief.status === "generated" ? (
                        <button onClick={() => setViewContent({ title: brief.title, content: brief.generated_content })} className="text-xs text-green-700 font-medium hover:underline whitespace-nowrap">
                          查看内容
                        </button>
                      ) : (
                        <button onClick={() => handleGenerateContent(brief.id)} disabled={generatingContent === brief.id} className="text-xs bg-zinc-900 text-white px-2.5 py-1 rounded hover:bg-zinc-800 disabled:opacity-50 whitespace-nowrap">
                          {generatingContent === brief.id ? "生成中..." : "生成内容"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ========== 渲染：内容库 ========== */

  function renderContentLib() {
    const generated = allBriefs.filter(b => b.status === "generated" && b.generated_content);
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-black">内容库</h2>
            <p className="text-sm text-zinc-500 mt-1">浏览和管理已生成的AI内容资产</p>
          </div>
          <button onClick={loadAllBriefs} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50">
            刷新
          </button>
        </div>

        {briefsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-xl bg-zinc-100 animate-pulse" />)}
          </div>
        ) : generated.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 py-16 text-center">
            <p className="text-sm text-zinc-400">暂无已生成的内容</p>
            <p className="text-xs text-zinc-300 mt-1">在「内容简报」中为简报生成内容后会自动出现在这里</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generated.map((brief) => {
              const fColors = FUNNEL_COLORS[brief.funnel_stage] || FUNNEL_COLORS.TOFU;
              const wordCount = brief.generated_content?.length || 0;
              const preview = brief.generated_content?.substring(0, 150) || "";
              return (
                <div key={brief.id} className="rounded-xl border border-zinc-200 bg-white hover:shadow-md transition-shadow overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${fColors.text} ${fColors.bg}`}>{brief.funnel_stage}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500">{CONTENT_TYPE_LABELS[brief.content_type] || brief.content_type}</span>
                    </div>
                    <h3 className="font-semibold text-black mb-1 line-clamp-1">{brief.title}</h3>
                    <p className="text-xs text-zinc-500 line-clamp-2 mb-3">{preview.replace(/^#+\s*/gm, "").replace(/\*\*/g, "")}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                        <span>{wordCount.toLocaleString()} 字</span>
                        <span>·</span>
                        <span>{brief.target_persona}</span>
                      </div>
                      <button
                        onClick={() => setViewContent({ title: brief.title, content: brief.generated_content })}
                        className="text-xs font-medium text-black hover:underline"
                      >
                        阅读全文 →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ========== 渲染：发布策略 ========== */

  const CHANNEL_OPTIONS = ["官网博客", "微信公众号", "知乎", "LinkedIn", "CSDN", "掘金", "InfoQ", "行业媒体投稿", "邮件营销", "社交媒体"];
  const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

  function renderPublish() {
    const planned = schedules.filter(s => s.status === "planned");
    const published = schedules.filter(s => s.status === "published");
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-black">发布策略</h2>
            <p className="text-sm text-zinc-500 mt-1">{planned.length} 条待发布 · {published.length} 条已发布</p>
          </div>
          <button onClick={() => setShowScheduleForm(true)} className="rounded-xl bg-black px-4 py-2 text-sm text-white hover:bg-zinc-800">
            + 添加排期
          </button>
        </div>

        {/* 添加排期表单 */}
        {showScheduleForm && (
          <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-6">
            <h3 className="font-semibold text-sm mb-4">新建发布排期</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <input value={scheduleForm.title} onChange={e => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                placeholder="内容标题 *" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none sm:col-span-2" />
              <select value={scheduleForm.channel} onChange={e => setScheduleForm({ ...scheduleForm, channel: e.target.value })}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none">
                <option value="">选择发布渠道</option>
                {CHANNEL_OPTIONS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
              </select>
              <input type="date" value={scheduleForm.scheduled_date} onChange={e => setScheduleForm({ ...scheduleForm, scheduled_date: e.target.value })}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none" />
              <input value={scheduleForm.notes} onChange={e => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                placeholder="备注（可选）" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none sm:col-span-2" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreateSchedule} className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-zinc-800">确认创建</button>
              <button onClick={() => setShowScheduleForm(false)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50">取消</button>
            </div>
          </div>
        )}

        {/* 排期列表 */}
        {schedulesLoading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-zinc-100 animate-pulse" />)}</div>
        ) : schedules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 py-16 text-center">
            <p className="text-sm text-zinc-400">暂无发布排期</p>
            <p className="text-xs text-zinc-300 mt-1">点击"+ 添加排期"制定内容发布计划</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* 按月分组 */}
            {(() => {
              const grouped: Record<string, Schedule[]> = {};
              schedules.forEach(s => {
                const key = s.scheduled_date ? s.scheduled_date.substring(0, 7) : "未排期";
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(s);
              });
              return Object.entries(grouped).map(([month, items]) => {
                const monthLabel = month === "未排期" ? "未排期" : (() => {
                  const [y, m] = month.split("-");
                  return `${y}年${MONTHS[parseInt(m) - 1]}`;
                })();
                return (
                  <div key={month}>
                    <h4 className="text-xs font-bold text-zinc-400 uppercase mb-2 ml-1">{monthLabel} · {items.length} 条</h4>
                    <div className="space-y-1.5">
                      {items.map(s => (
                        <div key={s.id} className={`rounded-lg border p-3 flex items-center justify-between transition-colors ${s.status === "published" ? "border-green-200 bg-green-50/50" : "border-zinc-200 bg-white hover:border-zinc-300"}`}>
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className={`h-2 w-2 rounded-full shrink-0 ${s.status === "published" ? "bg-green-500" : "bg-amber-400"}`} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-black truncate">{s.title}</p>
                              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                                {s.channel && <span>{s.channel}</span>}
                                {s.scheduled_date && <span>{new Date(s.scheduled_date).toLocaleDateString("zh-CN")}</span>}
                                {s.notes && <span className="text-zinc-300 truncate">— {s.notes}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 ml-3 shrink-0">
                            {s.status === "planned" && (
                              <>
                                <button onClick={() => handleUpdateSchedule(s.id, { status: "published", published_at: new Date().toISOString() })}
                                  className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 whitespace-nowrap">标记发布</button>
                                <button onClick={() => handleUpdateSchedule(s.id, { status: "cancelled" })}
                                  className="text-xs text-zinc-400 hover:text-red-500 px-1">取消</button>
                              </>
                            )}
                            {s.status === "published" && (
                              <span className="text-xs text-green-600">{s.published_at ? new Date(s.published_at).toLocaleDateString("zh-CN") : "已发布"}</span>
                            )}
                            {s.status === "cancelled" && (
                              <span className="text-xs text-zinc-400 line-through">已取消</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    );
  }

  /* ========== 渲染：GEO 发布中心 ========== */

  const ENGINE_ICONS: Record<string, string> = { chatgpt: "G", gemini: "Ge", claude: "C", perplexity: "P", bing: "B" };
  const ENGINE_COLORS: Record<string, string> = { chatgpt: "bg-green-100 text-green-700", gemini: "bg-blue-100 text-blue-700", claude: "bg-amber-100 text-amber-700", perplexity: "bg-purple-100 text-purple-700", bing: "bg-cyan-100 text-cyan-700" };

  function renderGeo() {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-black">GEO 发布中心</h2>
            <p className="text-sm text-zinc-500 mt-1">AI 引擎优化版本 · 分发至 ChatGPT / Perplexity / Claude 的可引用内容</p>
          </div>
          <button
            onClick={handleGenerateGeo}
            disabled={geoGenerating}
            className="rounded-xl bg-black px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {geoGenerating ? "生成中..." : "生成新 GEO 内容"}
          </button>
        </div>

        {/* 统计卡片 */}
        {geoStats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <div className="bg-white border rounded-xl p-4">
              <p className="text-xs text-zinc-400 mb-1">GEO 版本总数</p>
              <p className="text-2xl font-bold">{geoStats.total}</p>
            </div>
            <div className="bg-white border rounded-xl p-4">
              <p className="text-xs text-zinc-400 mb-1">平均 GEO 字数</p>
              <p className="text-2xl font-bold">{geoStats.avgWords}</p>
            </div>
            <div className="bg-white border rounded-xl p-4">
              <p className="text-xs text-zinc-400 mb-1">AI 引擎已引用</p>
              <p className={`text-2xl font-bold ${geoStats.cited > 0 ? "text-green-600" : "text-zinc-400"}`}>{geoStats.cited}</p>
            </div>
            <div className="bg-white border rounded-xl p-4">
              <p className="text-xs text-zinc-400 mb-1">分发渠道注册</p>
              <p className="text-2xl font-bold text-blue-600">{geoStats.channels}</p>
            </div>
            <div className="bg-white border rounded-xl p-4">
              <p className="text-xs text-zinc-400 mb-1">待引用引擎</p>
              <p className="text-2xl font-bold text-amber-600">{geoStats.total * 5 - geoStats.cited}</p>
            </div>
          </div>
        )}

        {/* 搜索 + 源内容选择 */}
        <div className="flex items-center gap-3 mb-6">
          <input
            type="text" value={geoSearch} onChange={(e) => setGeoSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") loadGeoVersions(); }}
            placeholder="搜索标题、Slug 或关键词..."
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-black w-64"
          />
          <select value={geoContentSelect} onChange={(e) => setGeoContentSelect(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none flex-1 max-w-xs">
            <option value="">选择源内容...</option>
            {availableContents.map(c => (
              <option key={c.id} value={c.id}>{c.title?.substring(0, 40)}{(c.title?.length || 0) > 40 ? "..." : ""}</option>
            ))}
          </select>
        </div>

        {/* GEO 内容卡片列表 */}
        {geoLoading ? (
          <div className="space-y-4">{[1, 2].map(i => <div key={i} className="h-48 rounded-xl bg-zinc-100 animate-pulse" />)}</div>
        ) : geoVersions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 py-16 text-center">
            <p className="text-sm text-zinc-400">暂无 GEO 优化内容</p>
            <p className="text-xs text-zinc-300 mt-1">选择源内容后点击"生成新 GEO 内容"，AI 将生成可被 ChatGPT/Claude 等引擎引用的优化版本</p>
          </div>
        ) : (
          <div className="space-y-4">
            {geoVersions.map((v) => (
              <div key={v.id} className="rounded-xl border border-zinc-200 bg-white overflow-hidden hover:shadow-sm transition-shadow">
                {/* 卡片头部 */}
                <div className="p-5 border-b border-zinc-100">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-black">{v.source_title || v.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                        <span>{v.source_slug || v.title}</span>
                        <span>·</span>
                        <span className="font-medium text-zinc-500">{v.framework || "Framework D"}</span>
                        <span>·</span>
                        <span>{v.source_word_count?.toLocaleString() || v.word_count?.toLocaleString()} words (article)</span>
                      </div>
                    </div>
                    <span className="text-xs text-zinc-400 shrink-0">{new Date(v.created_at).toLocaleDateString("zh-CN")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyGeo(v.geo_summary || v.content || "")}
                      className="text-xs bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded hover:bg-zinc-200"
                    >
                      复制
                    </button>
                  </div>
                </div>

                {/* GEO 优化版本 */}
                <div className="px-5 py-4 bg-zinc-50/50 border-b border-zinc-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-blue-700">GEO-Optimized Version</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">AI Citation Ready · ChatGPT / Perplexity / Claude</span>
                  </div>
                  <p className="text-sm text-zinc-700 leading-relaxed">
                    {v.geo_summary || v.content || "（无内容）"}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-zinc-400">
                      {v.word_count || (v.geo_summary || v.content || "").length} words · 可粘贴至 About / FAQ / Landing Page
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReoptimize(v.id)}
                        disabled={geoOptimizing === v.id}
                        className="text-xs text-blue-600 font-medium hover:underline disabled:opacity-50"
                      >
                        {geoOptimizing === v.id ? "优化中..." : "AI 重新优化"}
                      </button>
                      {v.status !== "published" ? (
                        <button
                          onClick={() => handlePublishGeo(v.id)}
                          disabled={geoPublishing === v.id}
                          className="text-xs bg-green-600 text-white px-3 py-1 rounded font-medium hover:bg-green-700 disabled:opacity-50"
                        >
                          {geoPublishing === v.id ? "发布中..." : "发布 → 注入结构化数据"}
                        </button>
                      ) : (
                        <span className="text-xs text-green-600 font-medium">✓ 已发布</span>
                      )}
                      <a
                        href={`/contents/${v.source_content_id || v.content_id}`}
                        target="_blank"
                        className="text-xs text-zinc-400 hover:text-black underline"
                      >
                        查看完整内容
                      </a>
                    </div>
                  </div>
                </div>

                {/* AI 引擎分发追踪 */}
                <div className="px-5 py-3">
                  <p className="text-xs font-semibold text-zinc-600 mb-2">
                    AI 引擎分发追踪
                    <span className="ml-1 text-zinc-400 font-normal">
                      {v.engine_tracking?.filter(e => e.status === "cited").length || 0} / {v.engine_tracking?.length || 5} 渠道
                    </span>
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {(v.engine_tracking || []).map((engine) => (
                      <div key={engine.engine} className="flex items-center gap-2 rounded-lg border border-zinc-100 p-2">
                        <span className={`text-[10px] font-bold w-5 h-5 rounded flex items-center justify-center shrink-0 ${ENGINE_COLORS[engine.engine] || "bg-zinc-100 text-zinc-500"}`}>
                          {ENGINE_ICONS[engine.engine] || engine.engine[0]?.toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] text-zinc-600 truncate">{engine.label}</p>
                          <span className={`text-[10px] ${engine.status === "cited" ? "text-green-600" : "text-zinc-400"}`}>
                            {engine.status === "cited" ? "✓ 已引用" : "未引用"}
                          </span>
                        </div>
                      </div>
                    ))}
                    {(v.engine_tracking || []).length === 0 && (
                      <p className="text-xs text-zinc-400 col-span-full">尚未注册引擎追踪</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ========== 占位视图 ========== */

  function renderPlaceholder(title: string, desc: string) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 py-24 text-center">
        <p className="text-lg font-bold text-zinc-300">{title}</p>
        <p className="text-sm text-zinc-300 mt-1">{desc}</p>
      </div>
    );
  }

  /* ========== 主渲染 ========== */

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      {/* 左侧子导航 */}
      <aside className="w-48 shrink-0 border-r border-zinc-200 bg-white p-3">
        <h3 className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
          增长系统
        </h3>
        <nav className="flex flex-col gap-0.5">
          {SUB_NAV.map((item) => (
            <button
              key={item.key}
              onClick={() => { setActiveTab(item.key); setSelectedCluster(null); }}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all text-left ${
                activeTab === item.key
                  ? "bg-black text-white"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <span>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-[10px] px-1 py-0.5 rounded bg-green-100 text-green-700 font-medium">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* 知识引擎状态 */}
        <div className="mt-6 mx-2 rounded-lg border border-green-200 bg-green-50 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs font-medium text-green-700">知识引擎 100%</span>
          </div>
          <p className="text-[10px] text-green-600">{new Date().toLocaleDateString("zh-CN")}</p>
        </div>
      </aside>

      {/* 右侧内容区 */}
      <div className="flex-1 px-6 py-8 overflow-y-auto">
        {activeTab === "clusters" && renderClusters()}
        {activeTab === "briefs" && renderBriefs()}
        {activeTab === "content_lib" && renderContentLib()}
        {activeTab === "publish" && renderPublish()}
        {activeTab === "seo" && renderSEO()}
        {activeTab === "geo" && renderGeo()}
      </div>
    </div>
  );
}
