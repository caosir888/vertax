import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { auditSEO, analyzeAEO, extractMetaInfo } from "@/lib/seo";

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
      content_body: content?.content || "",
      status: content?.status || "",
      tags: content?.tags || [],
      language: content?.language || "",
      word_count: (a.word_count as number) || 0,
      seo_score: (a.seo_score as number) || 0,
      aeo_score: (a.aeo_score as number) || 0,
      has_schema: (a.has_schema as boolean) || false,
      has_geo: (a.has_geo as boolean) || false,
      meta_title: (a.meta_title as string) || "",
      meta_description: (a.meta_description as string) || "",
      main_keyword: (a.main_keyword as string) || "",
      keyword_in_title: (a.keyword_in_title as boolean) || false,
      keyword_in_content: (a.keyword_in_content as boolean) || false,
      has_faq_section: (a.has_faq_section as boolean) || false,
      has_conclusion: (a.has_conclusion as boolean) || false,
      meta_title_score: (a.meta_title_score as number) || 0,
      word_count_score: (a.word_count_score as number) || 0,
      keyword_score: (a.keyword_score as number) || 0,
      faq_score: (a.faq_score as number) || 0,
      geo_score: (a.geo_score as number) || 0,
      aeo_details: a.aeo_details || {},
    };
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
      const title = (content.title as string) || "";
      const body = (content.content as string) || "";
      const tags = (content.tags as string[]) || [];
      const wordCount = body.length;

      const meta = extractMetaInfo(body, title, tags);
      const seoResult = await auditSEO(body, meta.meta_title, meta.meta_description, meta.main_keyword);
      const aeoResult = analyzeAEO(body, title);

      const seoScore = meta.meta_title_score + meta.meta_description_score + meta.word_count_score + meta.keyword_score;
      const aeoScore = aeoResult.faq_schema.score + aeoResult.geo_version.score;

      await db.from("seo_audits").upsert({
        content_id: content.id,
        team_id: user.team_id,
        seo_score: seoScore,
        aeo_score: aeoScore,
        title_score: meta.meta_title_score,
        meta_description_score: meta.meta_description_score,
        content_structure_score: seoResult.contentStructure?.score || 0,
        keyword_usage_score: meta.keyword_score,
        readability_score: seoResult.readability?.score || 0,
        internal_links_score: seoResult.internalLinks?.score || 0,
        meta_title: meta.meta_title,
        meta_description: meta.meta_description,
        main_keyword: meta.main_keyword,
        keyword_in_title: meta.keyword_in_title,
        keyword_in_content: meta.keyword_in_content,
        has_faq_section: meta.has_faq_section,
        has_conclusion: meta.has_conclusion,
        has_schema: false,
        has_geo: false,
        has_faq: meta.has_faq_section,
        meta_title_score: meta.meta_title_score,
        word_count_score: meta.word_count_score,
        keyword_score: meta.keyword_score,
        faq_score: aeoResult.faq_schema.score,
        geo_score: aeoResult.geo_version.score,
        aeo_details: {
          faq_schema: { status: aeoResult.faq_schema.generated ? "ok" : "missing", impact: aeoResult.faq_schema.generated ? "" : "影响 Rich Results" },
          geo_version: { status: aeoResult.geo_version.generated ? "ok" : "missing", impact: aeoResult.geo_version.generated ? "" : "AI 引擎无法引用" },
          faq_section: { status: aeoResult.faq_section.found ? "ok" : "missing", suggestion: aeoResult.faq_section.suggestion },
          conclusion: { status: aeoResult.conclusion.found ? "ok" : "missing", suggestion: aeoResult.conclusion.suggestion },
        },
        issues: seoResult.recommendations || [],
        recommendations: seoResult.recommendations || [],
        word_count: wordCount,
        updated_at: new Date().toISOString(),
      }, { onConflict: "content_id" });

      scanned++;
    } catch {
      // 单条失败跳过
    }
  }

  return NextResponse.json({ data: { scanned } });
}
