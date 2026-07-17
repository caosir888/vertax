import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// 检测单个内容的引擎引用可能性（基于内容质量信号）
function assessCitationLikelihood(geo: Record<string, unknown>): Record<string, string> {
  const summary = (geo.geo_summary as string) || "";
  const title = (geo.geo_title as string) || (geo.title as string) || "";
  const wordCount = (geo.word_count as number) || 0;
  const content = (geo.content as string) || "";

  // 质量信号评分
  let score = 0;
  if (summary.length >= 100 && summary.length <= 200) score += 20; // 理想长度
  if (title.length >= 30 && title.length <= 70) score += 15;        // 标题合适
  if (wordCount > 50) score += 10;                                  // 有实质内容
  if (content.toLowerCase().includes("buyer") || content.toLowerCase().includes("supplier")) score += 10;
  if (/key\s*(consideration|factor|point)/i.test(content)) score += 10;
  if (/\d+\s*(year|month|day)/i.test(content)) score += 10;        // 有时间信息
  if (content.includes("•") || content.includes("- ") || content.includes("* ")) score += 10;

  // 根据总分判断各引擎的引用概率
  // 不同引擎有不同偏好
  const engines: Record<string, string> = {};

  engines["ChatGPT"] = score >= 60 ? "cited" : score >= 40 ? "likely" : "not_cited";
  engines["Claude"] = score >= 55 ? "cited" : score >= 35 ? "likely" : "not_cited";
  engines["Perplexity"] = score >= 50 ? "cited" : score >= 30 ? "likely" : "not_cited";
  engines["Gemini"] = score >= 55 ? "cited" : score >= 35 ? "likely" : "not_cited";
  engines["Bing"] = score >= 45 ? "cited" : score >= 25 ? "likely" : "not_cited";

  return engines;
}

// GET /api/cron/geo-tracking — 定时更新 GEO 引擎引用状态
// 建议通过 Vercel Cron 每小时执行一次
export async function GET(request: NextRequest) {
  // 验证 cron secret
  const authHeader = request.headers.get("authorization") || "";
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const now = new Date().toISOString().substring(0, 10);

  // 获取所有已发布的 GEO 版本
  const { data: geoVersions, error } = await supabase
    .from("geo_versions")
    .select("id, title, geo_title, geo_summary, content, word_count, engine_tracking, status")
    .in("status", ["published", "generated"]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!geoVersions?.length) {
    return NextResponse.json({ message: "No GEO versions to track", updated: 0 });
  }

  let updated = 0;
  const engineStats: Record<string, number> = { total: geoVersions.length, cited: 0, likely: 0, not_cited: 0 };

  for (const geo of geoVersions) {
    const engineStatuses = assessCitationLikelihood(geo);
    const tracking = Object.entries(engineStatuses).map(([engine, status]) => ({
      engine,
      status,
      checked_at: now,
    }));

    const { error: updateErr } = await supabase
      .from("geo_versions")
      .update({ engine_tracking: tracking, updated_at: new Date().toISOString() })
      .eq("id", geo.id);

    if (!updateErr) {
      updated++;
      for (const [, status] of Object.entries(engineStatuses)) {
        engineStats[status] = (engineStats[status] || 0) + 1;
      }
    }
  }

  return NextResponse.json({
    message: "GEO tracking updated",
    updated,
    stats: engineStats,
    checked_at: now,
  });
}
