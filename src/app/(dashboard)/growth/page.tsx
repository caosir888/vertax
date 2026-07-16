"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface GrowthStats {
  total: number;
  published: number;
  draft: number;
  scheduled: number;
  seoHealthScore: number;
  geoVersions: number;
}

interface ContentItem {
  id: string;
  title: string;
  content: string;
  status: string;
  tags: string[];
  language: string;
  updated_at: string;
  created_at: string;
}

interface SEOAuditResult {
  overallScore: number;
  title: { score: number; issues: string[] };
  metaDescription: { score: number; issues: string[] };
  contentStructure: { score: number; issues: string[] };
  keywordUsage: { score: number; issues: string[] };
  readability: { score: number; issues: string[] };
  internalLinks: { score: number; issues: string[] };
  recommendations: string[];
}

interface EvidenceResult {
  claims: {
    statement: string;
    has_evidence: boolean;
    confidence: string;
    evidence_type: string;
    suggestion: string;
  }[];
  overall_assessment: string;
  risk_level: string;
}

const STATUS_LABELS: Record<string, string> = {
  published: "已发布",
  draft: "草稿",
  review: "审核中",
};

const STATUS_COLORS: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
  review: "bg-blue-100 text-blue-700",
};

export default function GrowthPage() {
  const [stats, setStats] = useState<GrowthStats>({
    total: 0,
    published: 0,
    draft: 0,
    scheduled: 0,
    seoHealthScore: 0,
    geoVersions: 0,
  });
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 详情面板
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // SEO 审计
  const [auditing, setAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<SEOAuditResult | null>(null);

  // 证据校验
  const [checking, setChecking] = useState(false);
  const [evidenceResult, setEvidenceResult] = useState<EvidenceResult | null>(null);
  const [checkClaim, setCheckClaim] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [statsRes, contentRes] = await Promise.all([
        fetch("/api/growth/overview"),
        fetch("/api/content?limit=50"),
      ]);
      const sJson = await statsRes.json();
      const cJson = await contentRes.json();
      if (sJson.data) setStats(sJson.data);
      if (cJson.data) setContents(cJson.data);
    } catch {
      toast.error("加载失败");
    } finally {
      setLoading(false);
    }
  }

  function openDetail(item: ContentItem) {
    setSelectedContent(item);
    setAuditResult(null);
    setEvidenceResult(null);
    setCheckClaim("");
    setDetailOpen(true);
  }

  async function runAudit() {
    if (!selectedContent) return;
    setAuditing(true);
    try {
      const res = await fetch("/api/seo/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: selectedContent.content,
          title: selectedContent.title,
          description: selectedContent.content?.substring(0, 160) || "",
          keyword: selectedContent.tags?.[0] || selectedContent.title,
        }),
      });
      const json = await res.json();
      if (json.data) {
        setAuditResult(json.data);
      } else {
        toast.error("审计失败");
      }
    } catch {
      toast.error("审计失败");
    } finally {
      setAuditing(false);
    }
  }

  async function runEvidenceCheck() {
    if (!selectedContent) return;
    setChecking(true);
    try {
      const res = await fetch("/api/growth/evidence-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: selectedContent.content,
          claim: checkClaim.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.data) {
        setEvidenceResult(json.data);
      } else {
        toast.error(json.error || "校验失败");
      }
    } catch {
      toast.error("校验失败");
    } finally {
      setChecking(false);
    }
  }

  function getScoreColor(score: number) {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  }

  function getScoreBg(score: number) {
    if (score >= 80) return "bg-green-50 border-green-200";
    if (score >= 60) return "bg-amber-50 border-amber-200";
    return "bg-red-50 border-red-200";
  }

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black">增长系统</h1>
            <p className="mt-2 text-sm text-zinc-500">
              SEO 内容生产与分发，AI 驱动的搜索增长引擎
            </p>
          </div>
          <Button
            onClick={loadAll}
            variant="outline"
            className="rounded-xl text-sm"
          >
            刷新
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-zinc-400 mb-1">内容资产</p>
            <p className="text-2xl font-bold">{loading ? "..." : stats.total}</p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-zinc-400 mb-1">已发布</p>
            <p className="text-2xl font-bold text-green-600">{loading ? "..." : stats.published}</p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-zinc-400 mb-1">草稿</p>
            <p className="text-2xl font-bold text-yellow-600">{loading ? "..." : stats.draft}</p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-zinc-400 mb-1">已排期</p>
            <p className="text-2xl font-bold text-zinc-400">{loading ? "..." : stats.scheduled}</p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-zinc-400 mb-1">SEO 健康分</p>
            <p className={`text-2xl font-bold ${getScoreColor(stats.seoHealthScore)}`}>
              {loading ? "..." : stats.seoHealthScore}
            </p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-zinc-400 mb-1">GEO 版本</p>
            <p className="text-2xl font-bold text-purple-600">{loading ? "..." : stats.geoVersions}</p>
          </div>
        </div>

        {/* 内容资产库 */}
        <div className="bg-white border rounded-xl">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-sm">内容资产库</h2>
            <span className="text-xs text-zinc-400">{contents.length} 篇</span>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-zinc-100 animate-pulse" />
              ))}
            </div>
          ) : contents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-zinc-400">暂无内容资产</p>
              <p className="text-xs text-zinc-400 mt-1">前往内容工坊创建你的第一篇 SEO 内容</p>
            </div>
          ) : (
            <div className="divide-y">
              {contents.map((item) => (
                <div
                  key={item.id}
                  onClick={() => openDetail(item)}
                  className="px-5 py-4 hover:bg-zinc-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-black truncate">
                        {item.title || "未命名"}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                        {item.content?.substring(0, 120) || "无内容"}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_COLORS[item.status] || "bg-zinc-100 text-zinc-500"}`}>
                          {STATUS_LABELS[item.status] || item.status}
                        </span>
                        {item.tags?.map((tag) => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500">
                            {tag}
                          </span>
                        ))}
                        <span className="text-xs text-zinc-300 ml-auto">
                          {new Date(item.updated_at).toLocaleDateString("zh-CN")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 详情弹窗 */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedContent?.title || "内容详情"}</DialogTitle>
            </DialogHeader>

            {selectedContent && (
              <div className="space-y-6">
                {/* 内容预览 */}
                <div>
                  <h4 className="text-xs font-bold text-zinc-500 mb-2 uppercase">内容预览</h4>
                  <div className="rounded-lg border bg-zinc-50 p-4 max-h-40 overflow-y-auto">
                    <p className="text-sm text-zinc-600 whitespace-pre-wrap line-clamp-6">
                      {selectedContent.content || "无内容"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_COLORS[selectedContent.status] || ""}`}>
                      {STATUS_LABELS[selectedContent.status]}
                    </span>
                    {selectedContent.tags?.map((tag) => (
                      <span key={tag} className="text-xs text-zinc-400">{tag}</span>
                    ))}
                  </div>
                </div>

                {/* SEO 健康评分 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase">SEO 健康评分</h4>
                    <button
                      onClick={runAudit}
                      disabled={auditing}
                      className="text-xs bg-black text-white px-3 py-1 rounded-lg hover:bg-zinc-800 disabled:opacity-50"
                    >
                      {auditing ? "审计中..." : auditResult ? "重新审计" : "开始审计"}
                    </button>
                  </div>

                  {auditResult ? (
                    <div className="space-y-3">
                      <div className={`rounded-xl border p-4 ${getScoreBg(auditResult.overallScore)}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">综合评分</span>
                          <span className={`text-2xl font-bold ${getScoreColor(auditResult.overallScore)}`}>
                            {auditResult.overallScore}
                          </span>
                        </div>
                      </div>
                      {(["title", "metaDescription", "contentStructure", "keywordUsage", "readability", "internalLinks"] as const).map((key) => {
                        const label: Record<string, string> = {
                          title: "标题", metaDescription: "描述", contentStructure: "结构",
                          keywordUsage: "关键词", readability: "可读性", internalLinks: "内链",
                        };
                        const item = auditResult[key];
                        return (
                          <div key={key} className="rounded-lg border p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium">{label[key]}</span>
                              <span className={`text-sm font-bold ${getScoreColor(item.score)}`}>{item.score}</span>
                            </div>
                            {item.issues.length > 0 && (
                              <ul className="text-xs text-zinc-500 space-y-0.5">
                                {item.issues.slice(0, 2).map((issue, i) => (
                                  <li key={i}>- {issue}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                      {auditResult.recommendations.length > 0 && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                          <p className="text-xs font-medium text-blue-700 mb-1">优先修复建议</p>
                          <ul className="text-xs text-blue-600 space-y-0.5">
                            {auditResult.recommendations.map((r, i) => (
                              <li key={i}>{i + 1}. {r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400">点击"开始审计"获取 AI SEO 评分</p>
                  )}
                </div>

                {/* 快速证据校验 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase">快速证据校验</h4>
                  </div>
                  <p className="text-xs text-zinc-400 mb-2">
                    检查内容中的关键主张是否有数据或案例支撑
                  </p>
                  <input
                    value={checkClaim}
                    onChange={(e) => setCheckClaim(e.target.value)}
                    placeholder="输入要校验的具体主张（可选，留空则检查全文）"
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none mb-2"
                  />
                  <button
                    onClick={runEvidenceCheck}
                    disabled={checking}
                    className="text-xs bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {checking ? "校验中..." : "检验证据支撑"}
                  </button>

                  {evidenceResult && (
                    <div className="mt-4 space-y-3">
                      <div className={`rounded-lg border p-3 ${
                        evidenceResult.risk_level === "高" ? "bg-red-50 border-red-200" :
                        evidenceResult.risk_level === "中" ? "bg-yellow-50 border-yellow-200" :
                        "bg-green-50 border-green-200"
                      }`}>
                        <p className="text-xs font-medium">
                          风险等级：{evidenceResult.risk_level}
                        </p>
                        <p className="text-xs text-zinc-600 mt-1">{evidenceResult.overall_assessment}</p>
                      </div>
                      {evidenceResult.claims?.map((c, i) => (
                        <div key={i} className="rounded-lg border p-3">
                          <p className="text-xs font-medium text-zinc-700 mb-1">"{c.statement}"</p>
                          <div className="flex items-center gap-2 text-xs">
                            <span className={c.has_evidence ? "text-green-600" : "text-red-500"}>
                              {c.has_evidence ? "有证据" : "缺乏证据"}
                            </span>
                            <span className="text-zinc-400">|</span>
                            <span className="text-zinc-500">置信度: {c.confidence}</span>
                            <span className="text-zinc-400">|</span>
                            <span className="text-zinc-500">{c.evidence_type}</span>
                          </div>
                          <p className="text-xs text-zinc-500 mt-1">{c.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
