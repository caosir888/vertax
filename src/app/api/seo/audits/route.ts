import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { auditSEO } from "@/lib/seo";
import { chat } from "@/lib/llm";

// GET /api/seo/audits — 列出所有 SEO/AEO 审计结果
export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const db = getSupabase();
  const params = request.nextUrl.searchParams;
  const search = params.get("search");
  const sort = params.get("sort") || "seo_score";
  const minScore = parseInt(params.get("min_score") || "0");
  const maxScore = parseInt(params.get("max_score") || "100");

  // 查所有审计结果 + 关联的 content 信息
  let query = db
    .from("seo_audits")
    .select("*, contents!inner(title, status, content, tags, language)")
    .eq("team_id", user.team_id)
    .gte("seo_score", minScore)
    .lte("seo_score", maxScore);

  if (search) {
    query = query.or(`contents.title.ilike.%${search}%`);
  }

  if (sort === "seo_score") {
    query = query.order("seo_score", { ascending: true });
  } else if (sort === "aeo_score") {
    query = query.order("aeo_score", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 统计
  const audits = (data || []).map((a: Record<string, unknown>) => {
    const content = a.contents as Record<string, unknown> | null;
    return {
      ...a,
      title: content?.title || "",
      status: content?.status || "",
      tags: content?.tags || [],
      language: content?.language || "",
      word_count: (a.word_count as number) || (typeof content?.content === "string" ? (content.content as string).length : 0),
      seo_score: (a.seo_score as number) || 0,
      aeo_score: (a.aeo_score as number) || 0,
      has_schema: (a.has_schema as boolean) || false,
      has_geo: (a.has_geo as boolean) || false,
    } as { seo_score: number; aeo_score: number; has_schema: boolean; has_geo: boolean; word_count: number; title: string; status: string; tags: string[]; language: string };
  });

  const seoScores = audits.map((a) => a.seo_score).filter(Boolean);
  const aeoScores = audits.map((a) => a.aeo_score).filter(Boolean);
  const avgSEO = seoScores.length > 0 ? Math.round(seoScores.reduce((a, b) => a + b, 0) / seoScores.length) : 0;
  const avgAEO = aeoScores.length > 0 ? Math.round(aeoScores.reduce((a, b) => a + b, 0) / aeoScores.length) : 0;
  const withSchema = audits.filter((a) => a.has_schema).length;
  const withGeo = audits.filter((a) => a.has_geo).length;
  const lowScore = audits.filter((a) => a.seo_score < 60).length;

  return NextResponse.json({
    data: {
      items: audits,
      stats: {
        total: audits.length,
        avgSEO,
        avgAEO,
        withSchema,
        withGeo,
        lowScore,
      },
    },
  });
}

// POST /api/seo/audits — 批量扫描内容
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const { content_ids } = body;

  const db = getSupabase();

  // 查询要扫描的内容
  let contentsQuery = db
    .from("contents")
    .select("id, title, content, tags, language, status")
    .eq("team_id", user.team_id);

  if (content_ids?.length) {
    contentsQuery = contentsQuery.in("id", content_ids);
  }

  const { data: contents, error: fetchError } = await contentsQuery;
  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!contents?.length) {
    return NextResponse.json({ error: "没有找到需要扫描的内容" }, { status: 400 });
  }

  let scanned = 0;
  for (const content of contents) {
    try {
      const keyword = (content.tags?.[0] as string) || (content.title as string);
      const description = (content.content as string)?.substring(0, 160) || "";

      // SEO 审计
      const seoResult = await auditSEO(
        (content.content as string) || "",
        content.title as string,
        description,
        keyword
      );

      // AEO 审计（AI 引擎可见性）
      let aeoScore = 0;
      try {
        const aeoPrompt = `评估以下内容对 AI 搜索引擎（如 ChatGPT、Perplexity）的可见性和引用友好度。
标题: ${content.title}
关键词: ${keyword}
内容(前800字): ${(content.content as string)?.substring(0, 800)}

从以下维度给0-100分并返回JSON：
{
  "score": <0-100>,
  "has_faq": <true/false，是否包含问答格式>,
  "has_schema_potential": <true/false，结构化数据潜力>,
  "clarity": <清晰度评分>,
  "authority": <权威性评分>,
  "recommendations": ["改进建议"]
}
只返回JSON。`;

        const aeoResponse = await chat([
          { role: "system", content: "你是AI搜索引擎优化专家。只返回JSON。" },
          { role: "user", content: aeoPrompt },
        ]);
        const aeoData = JSON.parse(aeoResponse.replace(/```json\n?|\n?```/g, "").trim());
        aeoScore = aeoData.score || 0;

        // Upsert 审计结果
        const wordCount = (content.content as string)?.length || 0;
        await db.from("seo_audits").upsert({
          content_id: content.id,
          team_id: user.team_id,
          seo_score: seoResult.overallScore,
          aeo_score: aeoScore,
          title_score: seoResult.title.score,
          meta_description_score: seoResult.metaDescription.score,
          content_structure_score: seoResult.contentStructure.score,
          keyword_usage_score: seoResult.keywordUsage.score,
          readability_score: seoResult.readability.score,
          internal_links_score: seoResult.internalLinks.score,
          has_schema: aeoData.has_schema_potential || false,
          has_geo: (content.language as string) !== "zh-CN",
          has_faq: aeoData.has_faq || false,
          issues: [
            ...seoResult.title.issues.map((i: string) => `[标题] ${i}`),
            ...seoResult.metaDescription.issues.map((i: string) => `[描述] ${i}`),
            ...seoResult.contentStructure.issues.map((i: string) => `[结构] ${i}`),
            ...seoResult.keywordUsage.issues.map((i: string) => `[关键词] ${i}`),
          ],
          recommendations: seoResult.recommendations,
          word_count: wordCount,
          updated_at: new Date().toISOString(),
        }, { onConflict: "content_id" });

        scanned++;
      } catch {
        // AEO 分析失败不影响 SEO 审计
        const wordCount = (content.content as string)?.length || 0;
        await db.from("seo_audits").upsert({
          content_id: content.id,
          team_id: user.team_id,
          seo_score: seoResult.overallScore,
          title_score: seoResult.title.score,
          meta_description_score: seoResult.metaDescription.score,
          content_structure_score: seoResult.contentStructure.score,
          keyword_usage_score: seoResult.keywordUsage.score,
          readability_score: seoResult.readability.score,
          internal_links_score: seoResult.internalLinks.score,
          issues: [
            ...seoResult.title.issues.map((i: string) => `[标题] ${i}`),
            ...seoResult.metaDescription.issues.map((i: string) => `[描述] ${i}`),
            ...seoResult.contentStructure.issues.map((i: string) => `[结构] ${i}`),
            ...seoResult.keywordUsage.issues.map((i: string) => `[关键词] ${i}`),
          ],
          recommendations: seoResult.recommendations,
          word_count: wordCount,
          updated_at: new Date().toISOString(),
        }, { onConflict: "content_id" });
        scanned++;
      }
    } catch {
      // 单条内容审计失败，跳过继续
    }
  }

  return NextResponse.json({ data: { scanned } });
}
