"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

interface AnalyticsData {
  stats: { total: number; published: number; review: number; draft: number; totalPublishes: number };
  platformCount: Record<string, number>;
  topContent: { id: string; content_id: string; views: number; likes: number; comments: number; shares: number; engagement: number }[];
  recentContents: { id: string; title: string; status: string; language: string; updated_at: string }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/content/analytics")
      .then((r) => r.json())
      .then((json) => { if (json.data) setData(json.data); })
      .catch(() => { toast.error("数据分析加载失败"); })
      .finally(() => setLoading(false));
  }, []);

  async function getAISuggestion() {
    setSuggestLoading(true);
    try {
      const res = await fetch("/api/content/analytics", { method: "PATCH" });
      const json = await res.json();
      setAiSuggestion(json.data?.suggestion || "");
    } catch {
      setAiSuggestion("获取建议失败");
    } finally {
      setSuggestLoading(false);
    }
  }

  const totalEngagement = data?.topContent?.reduce((s, c) => s + (c.engagement || 0), 0) || 0;

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold text-black">内容分析</h1>
        <p className="mt-2 text-sm text-zinc-500">
          内容效果追踪：浏览量、互动数据、AI 选题建议
        </p>

        {loading ? (
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-xl bg-zinc-100 animate-pulse h-28" />
            ))}
          </div>
        ) : data ? (
          <>
            {/* ====== 统计卡片 ====== */}
            <div className="mt-8 grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: "内容总数", value: data.stats.total, sub: "全部内容资产" },
                { label: "已发布", value: data.stats.published, sub: `${data.stats.totalPublishes} 次发布` },
                { label: "审核中", value: data.stats.review, sub: "待审核内容" },
                { label: "草稿", value: data.stats.draft, sub: "编辑中的内容" },
                { label: "总互动", value: totalEngagement, sub: "浏览/点赞/评论" },
              ].map((card) => (
                <div key={card.label} className="rounded-xl border border-zinc-200 bg-white p-5">
                  <div className="text-3xl font-bold text-black">{card.value}</div>
                  <div className="mt-1 text-sm font-medium text-zinc-600">{card.label}</div>
                  <div className="mt-1 text-xs text-zinc-400">{card.sub}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ====== 内容排行榜 ====== */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <h3 className="text-sm font-bold text-black mb-4">内容互动排行榜</h3>
                {data.topContent.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-2xl mb-2">📊</p>
                    <p className="text-xs text-zinc-400">暂无内容数据，去内容工坊发布内容吧</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.topContent.slice(0, 8).map((item, i) => {
                      const maxE = Math.max(1, data.topContent[0]?.engagement || 1);
                      const barPct = Math.round((item.engagement / maxE) * 100);
                      return (
                        <div key={item.id || item.content_id || i} className="flex items-center gap-3">
                          <span className={`text-xs font-bold w-5 ${i < 3 ? "text-yellow-500" : "text-zinc-300"}`}>
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="h-4 rounded-full bg-zinc-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-blue-400 transition-all duration-500"
                                style={{ width: `${Math.max(barPct, 2)}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs text-zinc-500 w-5 text-right">
                              {item.views || 0}
                            </span>
                            <span className="text-xs text-zinc-300 w-5 text-right">
                              {item.likes || 0}
                            </span>
                            <span className="text-xs font-medium text-zinc-600 w-8 text-right">
                              {item.engagement}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="mt-3 flex gap-4 text-[10px] text-zinc-300">
                  <span>👁 浏览</span><span>❤️ 点赞</span><span>🏆 互动分</span>
                </div>
              </div>

              {/* ====== 平台分布 + AI 建议 ====== */}
              <div className="space-y-6">
                {/* 平台分布 */}
                <div className="rounded-xl border border-zinc-200 bg-white p-6">
                  <h3 className="text-sm font-bold text-black mb-4">发布平台分布</h3>
                  {Object.keys(data.platformCount).length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-2xl mb-2">📤</p>
                      <p className="text-xs text-zinc-400">暂无发布记录</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(data.platformCount).map(([platform, count]) => {
                        const pct = Math.round((count / data.stats.totalPublishes) * 100);
                        return (
                          <div key={platform}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-zinc-600 capitalize">{platform}</span>
                              <span className="text-zinc-400">{count} 次 ({pct}%)</span>
                            </div>
                            <div className="h-4 rounded-full bg-zinc-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-green-400 transition-all duration-500"
                                style={{ width: `${Math.max(pct, 4)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* AI 选题建议 */}
                <div className="rounded-xl border border-zinc-200 bg-white p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-black">AI 选题建议</h3>
                    <button
                      onClick={getAISuggestion}
                      disabled={suggestLoading}
                      className="rounded-lg bg-black px-3 py-1.5 text-xs text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                    >
                      {suggestLoading ? "生成中..." : aiSuggestion ? "重新生成" : "生成建议"}
                    </button>
                  </div>
                  {aiSuggestion ? (
                    <p className="text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed">{aiSuggestion}</p>
                  ) : (
                    <p className="text-sm text-zinc-300 text-center py-4">
                      点击按钮让 AI 帮你推荐下周选题
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ====== 最近内容 ====== */}
            <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="text-sm font-bold text-black mb-4">最近更新内容</h3>
              {data.recentContents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-2xl mb-2">📝</p>
                  <p className="text-xs text-zinc-400">暂无最近内容</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100 text-xs text-zinc-400">
                        <th className="text-left py-2 font-medium">标题</th>
                        <th className="text-left py-2 font-medium">语言</th>
                        <th className="text-left py-2 font-medium">状态</th>
                        <th className="text-right py-2 font-medium">更新时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentContents.map((c) => (
                        <tr key={c.id} className="border-b border-zinc-50 last:border-0">
                          <td className="py-2.5 text-zinc-800">{c.title}</td>
                          <td className="py-2.5 text-zinc-400">{c.language}</td>
                          <td className="py-2.5">
                            <span className={`rounded-full px-2 py-0.5 text-xs ${
                              c.status === "published" ? "bg-green-100 text-green-700" :
                              c.status === "review" ? "bg-yellow-100 text-yellow-700" :
                              "bg-zinc-100 text-zinc-600"
                            }`}>
                              {c.status === "published" ? "已发布" : c.status === "review" ? "审核中" : "草稿"}
                            </span>
                          </td>
                          <td className="py-2.5 text-right text-zinc-400">
                            {new Date(c.updated_at).toLocaleDateString("zh-CN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
