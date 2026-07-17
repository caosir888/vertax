"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, Circle, ChevronRight, Sparkles, X, TrendingUp, Eye, MousePointerClick, Calendar, Globe, BarChart3, FileText, Target, BookOpen, Users, Zap, ArrowUpRight } from "lucide-react";

/* ========== Onboarding 配置 ========== */

const ONBOARDING_KEY = "vertax_onboarding_done";

const ONBOARDING_STEPS = [
  { key: "create_content", label: "创建第一篇内容", desc: "使用 AI 模板生成你的第一篇文章", href: "/content" },
  { key: "optimize_content", label: "完成一次智能优化", desc: "为内容执行 SEO/AEO/GEO 三检", href: "/content-hub" },
  { key: "publish_content", label: "发布第一篇内容", desc: "将内容发布到你的渠道", href: "/content-hub" },
  { key: "add_knowledge", label: "上传知识库文档", desc: "上传 PDF/Word 文档，构建 RAG 知识库", href: "/knowledge" },
  { key: "view_radar", label: "查看获客雷达", desc: "发现潜在客户和采购信号", href: "/radar" },
  { key: "check_calendar", label: "查看内容日历", desc: "规划你的内容发布时间线", href: "/content-calendar" },
];

/* ========== 小图表组件 ========== */

function MiniBar({ values, color, maxH = 60 }: { values: number[]; color: string; maxH?: number }) {
  const maxVal = Math.max(1, ...values);
  return (
    <div className="flex items-end gap-1" style={{ height: maxH }}>
      {values.map((v, i) => (
        <div
          key={i}
          className="w-3 rounded-t-sm transition-all"
          style={{ height: `${(v / maxVal) * maxH}px`, backgroundColor: color, opacity: 0.85 }}
          title={`${v}`}
        />
      ))}
    </div>
  );
}

function TrendBars({ labels, values, color }: { labels: string[]; values: number[]; color: string }) {
  const maxVal = Math.max(1, ...values);
  const h = 100;
  const barW = 28;
  const gap = 48;
  const w = labels.length * gap + 20;

  if (values.every((v) => v === 0)) {
    return <div className="flex items-center justify-center h-28 text-xs text-zinc-300">暂无数据</div>;
  }

  return (
    <div className="overflow-x-auto">
      <svg width={w} height={h + 28} className="mx-auto">
        {values.map((v, i) => {
          const barH = Math.max(3, (v / maxVal) * h);
          const x = i * gap + 16;
          const y = h - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx="3" fill={color} opacity="0.85" />
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" className="text-[10px]" fill="#52525b">{v || ""}</text>
              <text x={x + barW / 2} y={h + 16} textAnchor="middle" className="text-[10px]" fill="#a1a1aa">{labels[i]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ========== 常量 ========== */

const LEAD_STATUS: Record<string, { label: string; color: string; badge: string }> = {
  new: { label: "新线索", color: "bg-blue-500", badge: "bg-blue-100 text-blue-700" },
  contacted: { label: "已联系", color: "bg-yellow-500", badge: "bg-yellow-100 text-yellow-700" },
  qualified: { label: "已确认", color: "bg-purple-500", badge: "bg-purple-100 text-purple-700" },
  proposal: { label: "提案中", color: "bg-orange-500", badge: "bg-orange-100 text-orange-700" },
  won: { label: "已成交", color: "bg-green-500", badge: "bg-green-100 text-green-700" },
  lost: { label: "已流失", color: "bg-zinc-400", badge: "bg-zinc-100 text-zinc-600" },
};

const CONTENT_STATUS: Record<string, { label: string; color: string }> = {
  draft: { label: "草稿", color: "bg-zinc-400" },
  review: { label: "审核中", color: "bg-yellow-500" },
  published: { label: "已发布", color: "bg-green-500" },
  scheduled: { label: "已排期", color: "bg-blue-500" },
};

interface DashboardData {
  totalLeads: number; totalContent: number; totalDocs: number; totalSites: number; totalPublishes: number;
  monthLeads: number; leadStatusCount: Record<string, number>; contentStatusCount: Record<string, number>;
  recentLeads: { id: string; name: string; company: string; status: string; created_at: string }[];
  recentContent: { id: string; title: string; status: string; updated_at: string; scheduled_at?: string }[];
  recentRegistrations: { id: string; name: string; email: string; created_at: string }[];
  monthlyLabels: string[]; monthlyLeadData: number[]; monthlyContentData: number[];
  avgSeoScore: number | null; totalViews: number; totalClicks: number; totalEngagement: number;
  geoCount: number; totalCited: number; scheduledCount: number;
  upcomingScheduled: { id: string; title: string; scheduled_at: string }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState<Record<string, boolean>>({});
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    // 加载 onboarding 状态
    try {
      const saved = localStorage.getItem(ONBOARDING_KEY);
      if (saved) setOnboardingDone(JSON.parse(saved));
    } catch { /* ignore */ }

    // 加载数据
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((json) => { if (json.data) setData(json.data); })
      .catch(() => { toast.error("数据加载失败"); })
      .finally(() => setLoading(false));
  }, []);

  function toggleOnboardingStep(key: string) {
    setOnboardingDone((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(ONBOARDING_KEY, JSON.stringify(next));
      return next;
    });
  }

  const onboardingProgress = ONBOARDING_STEPS.filter((s) => onboardingDone[s.key]).length;
  const onboardingPct = Math.round((onboardingProgress / ONBOARDING_STEPS.length) * 100);

  const maxLeadCount = data ? Math.max(1, ...Object.values(data.leadStatusCount)) : 1;
  const maxContentCount = data ? Math.max(1, ...Object.values(data.contentStatusCount)) : 1;
  const conversionRate = data ? Math.round((data.leadStatusCount.won || 0) / Math.max(1, data.totalLeads) * 100) : 0;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-black">数据看板</h1>
          <p className="text-sm text-zinc-500 mt-0.5">业务概览 · 内容表现 · 线索转化</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/content-hub" className="inline-flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800">
            <Sparkles className="h-3.5 w-3.5" />新建内容
          </Link>
        </div>
      </div>

      {/* ====== Onboarding 引导卡片 ====== */}
      {showOnboarding && onboardingPct < 100 && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white p-5 relative">
          <button onClick={() => setShowOnboarding(false)} className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-600">
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">👋</span>
            <h2 className="text-sm font-bold text-black">欢迎使用智客！快速上手指南</h2>
          </div>
          <p className="text-xs text-zinc-500 mb-3">完成以下步骤，快速掌握核心功能</p>
          {/* 进度条 */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-2 rounded-full bg-zinc-100 overflow-hidden">
              <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${onboardingPct}%` }} />
            </div>
            <span className="text-xs font-medium text-blue-600">{onboardingProgress}/{ONBOARDING_STEPS.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {ONBOARDING_STEPS.map((step) => {
              const done = onboardingDone[step.key];
              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-all ${
                    done ? "border-green-200 bg-green-50" : "border-zinc-200 bg-white hover:border-blue-200"
                  }`}
                  onClick={() => toggleOnboardingStep(step.key)}
                >
                  {done ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> : <Circle className="h-4 w-4 text-zinc-300 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${done ? "text-green-700 line-through" : "text-black"}`}>{step.label}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{step.desc}</p>
                  </div>
                  <Link href={step.href} onClick={(e) => e.stopPropagation()} className="shrink-0 text-zinc-300 hover:text-blue-500">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Onboarding 完成提示 */}
      {showOnboarding && onboardingPct === 100 && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎉</span>
            <div>
              <p className="text-sm font-bold text-green-800">全部完成！</p>
              <p className="text-xs text-green-600">你已经掌握了智客的核心功能，开始高效获客吧</p>
            </div>
          </div>
          <button onClick={() => setShowOnboarding(false)} className="text-xs text-green-600 hover:text-green-800">收起</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl bg-zinc-100 animate-pulse h-28" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* ====== 核心指标卡片 ====== */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {[
              { label: "线索总数", value: data.totalLeads, sub: `本月 +${data.monthLeads}`, icon: Users, color: "text-blue-600", href: "/leads" },
              { label: "内容资产", value: data.totalContent, sub: `${data.contentStatusCount.published || 0} 已发布`, icon: FileText, color: "text-purple-600", href: "/content" },
              { label: "SEO 均分", value: data.avgSeoScore ?? "—", sub: data.avgSeoScore ? `${data.totalPublishes} 次发布` : "待优化", icon: TrendingUp, color: "text-green-600", href: "/content-hub" },
              { label: "内容互动", value: data.totalEngagement, sub: `${data.totalViews} 浏览 ${data.totalClicks} 点击`, icon: Eye, color: "text-orange-600", href: "/content-hub" },
              { label: "AI 引用", value: data.totalCited, sub: `${data.geoCount} GEO 版本`, icon: Globe, color: "text-cyan-600", href: "/growth" },
              { label: "转化率", value: `${conversionRate}%`, sub: `${data.leadStatusCount.won || 0} 已成交`, icon: Target, color: "text-rose-600", href: "/leads" },
            ].map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-zinc-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                  <span className="text-xs text-zinc-400">{card.label}</span>
                </div>
                <div className="text-2xl font-bold text-black">{card.value}</div>
                <div className="mt-1 text-[10px] text-zinc-400 group-hover:text-zinc-500">{card.sub}</div>
              </Link>
            ))}
          </div>

          {/* ====== 第二行：双趋势图 ====== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-black flex items-center gap-2"><BarChart3 className="h-4 w-4 text-blue-500" />线索月度趋势</h3>
                <Link href="/leads" className="text-xs text-zinc-400 hover:text-black">查看 →</Link>
              </div>
              <TrendBars labels={data.monthlyLabels} values={data.monthlyLeadData} color="#3b82f6" />
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-black flex items-center gap-2"><FileText className="h-4 w-4 text-purple-500" />内容创作趋势</h3>
                <Link href="/content" className="text-xs text-zinc-400 hover:text-black">查看 →</Link>
              </div>
              <TrendBars labels={data.monthlyLabels} values={data.monthlyContentData} color="#8b5cf6" />
            </div>
          </div>

          {/* ====== 第三行：漏斗 + 最近动态 + 排期 ====== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* 线索漏斗 */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <h3 className="text-sm font-bold text-black mb-4">线索转化漏斗</h3>
              <div className="space-y-2.5">
                {Object.entries(LEAD_STATUS).map(([key, st]) => {
                  const count = data.leadStatusCount[key] || 0;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <span className="text-zinc-500">{st.label}</span>
                        <span className="text-zinc-400 font-medium">{count}</span>
                      </div>
                      <div className="h-4 rounded-full bg-zinc-100 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${st.color}`}
                          style={{ width: `${Math.max((count / maxLeadCount) * 100, 2)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 最近动态 */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <h3 className="text-sm font-bold text-black mb-3">最近内容</h3>
              {data.recentContent.length === 0 ? (
                <p className="text-sm text-zinc-300 text-center py-6">暂无内容</p>
              ) : (
                <div className="space-y-2">
                  {data.recentContent.map((c) => (
                    <Link key={c.id} href={`/content/${c.id}`} className="flex items-center justify-between py-1.5 border-b border-zinc-50 last:border-0 hover:bg-zinc-50 -mx-1 px-1 rounded">
                      <span className="text-xs font-medium text-black truncate flex-1 mr-2">{c.title}</span>
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] ${c.status === "published" ? "bg-green-100 text-green-700" : c.status === "scheduled" ? "bg-blue-100 text-blue-600" : c.status === "review" ? "bg-yellow-100 text-yellow-700" : "bg-zinc-100 text-zinc-600"}`}>
                        {CONTENT_STATUS[c.status]?.label || c.status}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* 即将发布 */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <h3 className="text-sm font-bold text-black mb-3 flex items-center gap-2"><Calendar className="h-4 w-4 text-blue-500" />即将发布</h3>
              {(data.upcomingScheduled || []).length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-zinc-300 mb-2">暂无排期内容</p>
                  <Link href="/content-hub" className="text-xs text-blue-500 hover:text-blue-700">去排期 →</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {(data.upcomingScheduled || []).map((s) => (
                    <div key={s.id} className="flex items-center gap-2 py-1.5 border-b border-zinc-50 last:border-0">
                      <Calendar className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                      <span className="text-xs text-black truncate flex-1">{s.title}</span>
                      <span className="text-[10px] text-zinc-400 shrink-0">{new Date(s.scheduled_at).toLocaleDateString("zh-CN")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ====== 第四行：快速入口 ====== */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {[
              { label: "智能内容中心", desc: "SEO/AEO/GEO", icon: "🧠", href: "/content-hub" },
              { label: "内容工坊", desc: "AI 创作", icon: "✍️", href: "/content" },
              { label: "获客雷达", desc: "发现线索", icon: "📡", href: "/radar" },
              { label: "知识库", desc: "RAG 问答", icon: "📚", href: "/knowledge" },
              { label: "独立站", desc: "AI 建站", icon: "🌐", href: "/sites" },
              { label: "数据分析", desc: "深度分析", icon: "📈", href: "/analytics" },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-zinc-300 hover:shadow-sm transition-all text-center group">
                <span className="text-2xl">{item.icon}</span>
                <p className="mt-2 text-sm font-medium text-black group-hover:text-blue-600">{item.label}</p>
                <p className="text-[10px] text-zinc-400">{item.desc}</p>
              </Link>
            ))}
          </div>

          {/* ====== 线索列表 ====== */}
          {data.recentLeads.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-black flex items-center gap-2"><Users className="h-4 w-4 text-blue-500" />最近线索</h3>
                <Link href="/leads" className="text-xs text-zinc-400 hover:text-black">查看全部 →</Link>
              </div>
              <div className="space-y-1.5">
                {data.recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-black">{lead.name}</p>
                      <p className="text-xs text-zinc-400">{lead.company || "—"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${LEAD_STATUS[lead.status]?.badge || "bg-zinc-100 text-zinc-500"}`}>
                        {LEAD_STATUS[lead.status]?.label}
                      </span>
                      <span className="text-[10px] text-zinc-400">{new Date(lead.created_at).toLocaleDateString("zh-CN")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-300 py-20 text-center text-sm text-zinc-400">
          加载失败，请刷新重试
        </div>
      )}
    </div>
  );
}
