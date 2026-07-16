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
    status: string;
    tags: string[];
    language: string;
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
          <button
            onClick={handleBatchScan}
            disabled={seoScanning}
            className="rounded-xl bg-black px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {seoScanning ? "扫描中..." : "批量扫描"}
          </button>
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
            <p className="text-xs text-zinc-300 mt-1">点击"批量扫描"对现有内容进行 SEO/AEO 分析</p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* 表头 */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-zinc-400">
              <span className="col-span-1">SEO</span>
              <span className="col-span-1">AEO</span>
              <span className="col-span-4">标题</span>
              <span className="col-span-1">状态</span>
              <span className="col-span-2">关键词</span>
              <span className="col-span-1 text-right">字数</span>
              <span className="col-span-2 text-center">标记</span>
            </div>
            {seoData.items.map((item) => {
              const isExpanded = expandedAudit === item.id;
              const seoBadge = getScoreBadge(item.seo_score);
              const aeoBadge = getScoreBadge(item.aeo_score);
              return (
                <div key={item.id}>
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
                    </div>
                    <span className="col-span-1 text-xs text-zinc-500">{item.status === "published" ? "published" : "draft"}</span>
                    <span className="col-span-2 text-xs text-zinc-400 truncate">
                      {(item.tags || []).join(", ") || item.title}
                    </span>
                    <span className="col-span-1 text-xs text-zinc-400 text-right">{item.word_count?.toLocaleString()} words</span>
                    <div className="col-span-2 flex items-center justify-center gap-1.5">
                      {item.has_schema && <span className="text-[10px] px-1 py-0.5 rounded bg-purple-100 text-purple-600">Schema</span>}
                      {item.has_geo && <span className="text-[10px] px-1 py-0.5 rounded bg-blue-100 text-blue-600">GEO</span>}
                      {item.has_faq && <span className="text-[10px] px-1 py-0.5 rounded bg-cyan-100 text-cyan-600">FAQ</span>}
                      <span className={`text-[10px] px-1 py-0.5 rounded ${item.aeo_score >= 60 ? "bg-green-100 text-green-600" : "bg-zinc-100 text-zinc-500"}`}>AEO</span>
                    </div>
                  </div>

                  {/* 展开详情 */}
                  {isExpanded && (
                    <div className="mx-2 mb-2 rounded-b-xl border border-t-0 border-zinc-200 bg-zinc-50/50 p-5 space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {[
                          ["标题优化", item.title_score],
                          ["Meta 描述", item.meta_description_score],
                          ["内容结构", item.content_structure_score],
                          ["关键词使用", item.keyword_usage_score],
                          ["可读性", item.readability_score],
                          ["内链", item.internal_links_score],
                        ].map(([label, score]) => (
                          <div key={label as string} className={`rounded-lg border p-3 ${getScoreColor(score as number)}`}>
                            <p className="text-xs text-zinc-500 mb-1">{label as string}</p>
                            <p className="text-lg font-bold">{(score as number) || 0}</p>
                          </div>
                        ))}
                      </div>

                      {item.issues?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-zinc-600 mb-2">发现的问题</p>
                          <ul className="space-y-1">
                            {item.issues.map((issue, i) => (
                              <li key={i} className="text-xs text-zinc-500 flex items-start gap-1.5">
                                <span className="text-red-400 mt-0.5">•</span>
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {item.recommendations?.length > 0 && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                          <p className="text-xs font-bold text-blue-700 mb-2">改进建议</p>
                          <ul className="space-y-1">
                            {item.recommendations.map((r, i) => (
                              <li key={i} className="text-xs text-blue-600">{i + 1}. {r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
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
        {activeTab === "briefs" && renderPlaceholder("内容简报", "查看和管理所有内容简报")}
        {activeTab === "content_lib" && renderPlaceholder("内容库", "浏览和管理已生成的内容资产")}
        {activeTab === "publish" && renderPlaceholder("发布策略", "制定内容发布计划和渠道策略")}
        {activeTab === "seo" && renderSEO()}
        {activeTab === "geo" && renderPlaceholder("GEO 发布中心", "多语言/多地域内容分发")}
      </div>
    </div>
  );
}
