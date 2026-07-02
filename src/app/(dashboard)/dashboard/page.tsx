"use client";

import { useState, useEffect } from "react";

interface DashboardData {
  totalLeads: number;
  totalContent: number;
  totalDocs: number;
  totalSites: number;
  totalPublishes: number;
  monthLeads: number;
  leadStatusCount: Record<string, number>;
  contentStatusCount: Record<string, number>;
  recentLeads: { id: string; name: string; company: string; status: string; created_at: string }[];
  recentContent: { id: string; title: string; status: string; updated_at: string }[];
  monthlyLabels: string[];
  monthlyLeadData: number[];
  monthlyContentData: number[];
}

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
};

function TrendBars({ labels, values, color }: { labels: string[]; values: number[]; color: string }) {
  const maxVal = Math.max(1, ...values);
  const h = 140;
  const w = labels.length * 52 + 30;
  const barW = 32;
  const gap = 52;

  if (maxVal === 0 || values.every((v) => v === 0)) {
    return (
      <div className="flex items-center justify-center h-36 text-xs text-zinc-300">
        暂无数据
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <svg width={w} height={h + 30} className="mx-auto">
        {values.map((v, i) => {
          const barH = Math.max(4, (v / maxVal) * h);
          const x = i * gap + 20;
          const y = h - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx="3" fill={color} opacity="0.85" />
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" className="text-[10px]" fill="#52525b">
                {v}
              </text>
              <text x={x + barW / 2} y={h + 16} textAnchor="middle" className="text-[10px]" fill="#a1a1aa">
                {labels[i]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setData(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const maxLeadCount = data
    ? Math.max(1, ...Object.values(data.leadStatusCount))
    : 1;
  const maxContentCount = data
    ? Math.max(1, ...Object.values(data.contentStatusCount))
    : 1;

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold text-black">数据分析</h1>
        <p className="mt-2 text-sm text-zinc-500">
          业务概览：线索转化漏斗、内容产出、知识库资产
        </p>

        {loading ? (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-xl bg-zinc-100 animate-pulse h-28" />
            ))}
          </div>
        ) : data ? (
          <>
            {/* ====== 统计卡片 ====== */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: "线索总数", value: data.totalLeads, sub: `本月 +${data.monthLeads}`, href: "/leads" },
                { label: "内容资产", value: data.totalContent, sub: `${data.contentStatusCount.published || 0} 已发布`, href: "/content" },
                { label: "知识库文档", value: data.totalDocs, sub: "RAG 向量检索", href: "/knowledge" },
                { label: "独立站", value: data.totalSites, sub: `${data.totalPublishes} 次发布`, href: "/sites" },
                { label: "已成交", value: data.leadStatusCount.won || 0, sub: `${data.leadStatusCount.won && data.leadStatusCount.new ? Math.round((data.leadStatusCount.won / Math.max(1, data.totalLeads)) * 100) : 0}% 转化率`, href: "/leads" },
              ].map((card) => (
                <a
                  key={card.label}
                  href={card.href}
                  className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-300 transition-colors"
                >
                  <div className="text-3xl font-bold text-black">{card.value}</div>
                  <div className="mt-1 text-sm font-medium text-zinc-600">{card.label}</div>
                  <div className="mt-1 text-xs text-zinc-400">{card.sub}</div>
                </a>
              ))}
            </div>

            {/* ====== 月度趋势图 ====== */}
            {data.monthlyLabels?.length > 0 && (
              <div className="mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 线索月度趋势 */}
                  <div className="rounded-xl border border-zinc-200 bg-white p-6">
                    <h3 className="text-sm font-bold text-black mb-4">线索月度趋势</h3>
                    <TrendBars
                      labels={data.monthlyLabels}
                      values={data.monthlyLeadData}
                      color="#3b82f6"
                    />
                  </div>
                  {/* 内容月度趋势 */}
                  <div className="rounded-xl border border-zinc-200 bg-white p-6">
                    <h3 className="text-sm font-bold text-black mb-4">内容创作趋势</h3>
                    <TrendBars
                      labels={data.monthlyLabels}
                      values={data.monthlyContentData}
                      color="#8b5cf6"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ====== 两栏图表 ====== */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 线索漏斗 */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <h3 className="text-sm font-bold text-black mb-5">线索转化漏斗</h3>
                <div className="space-y-3">
                  {Object.entries(LEAD_STATUS).map(([key, st]) => {
                    const count = data.leadStatusCount[key] || 0;
                    const pct = Math.round((count / data.totalLeads) * 100) || 0;
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-zinc-600">{st.label}</span>
                          <span className="text-zinc-400">{count}</span>
                        </div>
                        <div className="h-5 rounded-full bg-zinc-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${st.color}`}
                            style={{ width: `${Math.max((count / maxLeadCount) * 100, 2)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 内容状态 */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <h3 className="text-sm font-bold text-black mb-5">内容状态分布</h3>
                <div className="space-y-3">
                  {Object.entries(CONTENT_STATUS).map(([key, st]) => {
                    const count = data.contentStatusCount[key] || 0;
                    const pct = Math.round((count / data.totalContent) * 100) || 0;
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-zinc-600">{st.label}</span>
                          <span className="text-zinc-400">
                            {count} <span className="text-zinc-300">({pct}%)</span>
                          </span>
                        </div>
                        <div className="h-5 rounded-full bg-zinc-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${st.color}`}
                            style={{ width: `${Math.max((count / maxContentCount) * 100, 2)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ====== 最近动态 ====== */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 最近线索 */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-black">最近线索</h3>
                  <a href="/leads" className="text-xs text-zinc-400 hover:text-black transition-colors">
                    查看全部 →
                  </a>
                </div>
                {data.recentLeads.length === 0 ? (
                  <p className="text-sm text-zinc-300 text-center py-8">暂无数据</p>
                ) : (
                  <div className="space-y-2">
                    {data.recentLeads.map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-black">{lead.name}</p>
                          <p className="text-xs text-zinc-400">{lead.company || "—"}</p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${LEAD_STATUS[lead.status]?.badge || "bg-zinc-100 text-zinc-500"}`}>
                          {LEAD_STATUS[lead.status]?.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 最近内容 */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-black">最近内容</h3>
                  <a href="/content" className="text-xs text-zinc-400 hover:text-black transition-colors">
                    查看全部 →
                  </a>
                </div>
                {data.recentContent.length === 0 ? (
                  <p className="text-sm text-zinc-300 text-center py-8">暂无数据</p>
                ) : (
                  <div className="space-y-2">
                    {data.recentContent.map((c) => (
                      <div key={c.id} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                        <p className="text-sm font-medium text-black truncate flex-1 mr-3">{c.title}</p>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${c.status === "published" ? "bg-green-100 text-green-700" : c.status === "review" ? "bg-yellow-100 text-yellow-700" : "bg-zinc-100 text-zinc-600"}`}>
                          {CONTENT_STATUS[c.status]?.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed border-zinc-300 py-20 text-center text-sm text-zinc-400">
            加载失败，请刷新重试
          </div>
        )}
      </div>
    </div>
  );
}
