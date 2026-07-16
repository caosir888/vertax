import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { chat } from "@/lib/llm";
import { logActivity } from "@/lib/activity-logger";

const AI_ENGINES = [
  { key: "chatgpt", label: "ChatGPT", icon: "G" },
  { key: "gemini", label: "Gemini / Google AI Overviews", icon: "Ge" },
  { key: "claude", label: "Claude", icon: "C" },
  { key: "perplexity", label: "Perplexity", icon: "P" },
  { key: "bing", label: "Bing Copilot", icon: "B" },
];

// GET /api/growth/geo — GEO AI 引文优化列表 + 统计
export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const db = getSupabase();
  const url = request.nextUrl.searchParams;
  const search = url.get("search") || "";
  const framework = url.get("framework");

  let query = db.from("geo_versions")
    .select("*, contents!source_content_id(title, slug, content)")
    .eq("team_id", user.team_id)
    .order("created_at", { ascending: false });

  if (framework) query = query.eq("framework", framework);
  if (search) {
    query = query.or(`title.ilike.%${search}%,geo_title.ilike.%${search}%,geo_summary.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = (data || []).map((g: Record<string, unknown>) => {
    const src = g.contents as Record<string, unknown> | null;
    return {
      ...g,
      source_title: src?.title || g.title || "",
      source_slug: src?.slug || "",
      source_word_count: typeof src?.content === "string" ? (src.content as string).length : 0,
    };
  });

  // 统计
  const total = items.length;
  const avgWords = total > 0 ? Math.round(items.reduce((s: number, i: Record<string, unknown>) => s + ((i.word_count as number) || 0), 0) / total) : 0;
  const enginesWithData = items.flatMap((i: Record<string, unknown>) => (i.engine_tracking as Array<Record<string, unknown>>) || []);
  const cited = enginesWithData.filter((e: Record<string, unknown>) => e.status === "cited").length;
  const channelCount = new Set(enginesWithData.map((e: Record<string, unknown>) => e.engine || e.key)).size || 0;

  return NextResponse.json({
    data: {
      items,
      stats: { total, avgWords, cited, channels: Math.max(channelCount, AI_ENGINES.length) },
    },
  });
}

// POST /api/growth/geo — 生成 GEO 优化内容
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = await request.json();
  const db = getSupabase();
  const action = body.action || "generate-geo";

  if (action === "generate-geo") {
    const contentId = body.content_id;
    if (!contentId) return NextResponse.json({ error: "请提供源内容 ID" }, { status: 400 });

    const { data: content } = await db.from("contents")
      .select("id,title,content,slug,tags")
      .eq("id", contentId).eq("team_id", user.team_id).single();

    if (!content) return NextResponse.json({ error: "源内容不存在" }, { status: 404 });

    const title = (content.title as string) || "";
    const body_text = (content.content as string) || "";
    const slug = (content.slug as string) || "";
    const tags = (content.tags as string[]) || [];

    const prompt = `你是一个GEO（Generative Engine Optimization）专家。请为以下内容生成一个适合AI搜索引擎（ChatGPT/Claude/Perplexity/Gemini/Bing）引用的优化版本。

源标题: ${title}
源Slug: ${slug}
关键词: ${tags.join(", ")}
源内容(前2000字):
${body_text.substring(0, 2000)}

请以JSON格式返回（只返回JSON）：
{
  "geo_title": "AI引擎优化标题（简洁专业，包含核心关键词）",
  "geo_summary": "AI引文优化摘要（120-180字英文，结构化格式）：[产品/概念名称]: An Overview for Global B2B Buyers. [核心定义一句话]. Companies sourcing [关键词] should evaluate suppliers based on [3-5个关键评估维度]. Key considerations include: [列举要点]. Chinese manufacturers are a major source for [关键词] globally, offering competitive pricing with improving quality standards. When evaluating suppliers, [3-4条实操建议]. For B2B buyers, the most important factors are: [总结关键因素]. Conducting due diligence before committing to large orders is always recommended.",
  "framework": "Framework D"
}

要求：
- geo_summary 必须是英文，120-180字
- 结构为 B2B 采购指南风格
- 适合被 AI 搜索引擎作为引用片段展示
- framework 从 Framework A/B/C/D 中选择（D=标准B2B采购指南）`;

    try {
      const response = await chat([
        { role: "system", content: "你是一个GEO优化专家，擅长为AI搜索引擎生成可引用的结构化内容。只返回JSON。" },
        { role: "user", content: prompt },
      ]);

      const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
      const geo = JSON.parse(cleaned);

      const { data: inserted, error: insertError } = await db.from("geo_versions").insert({
        team_id: user.team_id,
        user_id: user.id,
        source_content_id: contentId,
        content_id: contentId,
        language: "en",
        title: title,
        geo_title: geo.geo_title || title,
        geo_summary: geo.geo_summary || "",
        framework: geo.framework || "Framework D",
        word_count: (geo.geo_summary || "").length,
        content: geo.geo_summary || "",
        status: "generated",
        source: "ai",
        source_type: "generated",
        engine_tracking: AI_ENGINES.map(e => ({ engine: e.key, label: e.label, status: "not_cited", checked_at: new Date().toISOString().substring(0, 10) })),
      }).select().single();

      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

      logActivity({ team_id: user.team_id!, user_id: user.id, user_name: user.name, action: "geo_generate", target: inserted.id, details: title });

      return NextResponse.json({ data: inserted }, { status: 201 });
    } catch (err: unknown) {
      return NextResponse.json({ error: "AI 生成失败: " + (err instanceof Error ? err.message : "") }, { status: 500 });
    }
  }

  if (action === "reoptimize") {
    const geoId = body.id;
    const { data: geo } = await db.from("geo_versions").select("*, contents!source_content_id(title, content, tags)").eq("id", geoId).eq("team_id", user.team_id).single();
    if (!geo) return NextResponse.json({ error: "GEO 版本不存在" }, { status: 404 });

    const src = geo.contents as Record<string, unknown> | null;
    const prompt = `请重新优化以下GEO内容，使其更适合AI搜索引擎引用。

原标题: ${src?.title || geo.title}
原GEO摘要: ${geo.geo_summary}
源内容(前1500字): ${typeof src?.content === "string" ? src.content.substring(0, 1500) : ""}

请改进：更简洁、更有信息密度、更结构化。返回JSON：
{
  "geo_summary": "优化后的英文摘要(120-180字)"
}
只返回JSON。`;

    try {
      const response = await chat([
        { role: "system", content: "你是GEO优化专家。只返回JSON。" },
        { role: "user", content: prompt },
      ]);
      const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
      const result = JSON.parse(cleaned);

      await db.from("geo_versions").update({
        geo_summary: result.geo_summary,
        content: result.geo_summary,
        word_count: (result.geo_summary || "").length,
        updated_at: new Date().toISOString(),
      }).eq("id", geoId);

      return NextResponse.json({ data: { ...geo, geo_summary: result.geo_summary, word_count: (result.geo_summary || "").length } });
    } catch (err: unknown) {
      return NextResponse.json({ error: "重新优化失败: " + (err instanceof Error ? err.message : "") }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "无效操作" }, { status: 400 });
}

// PATCH /api/growth/geo — 更新引擎追踪状态
export async function PATCH(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = await request.json();
  const db = getSupabase();

  if (body.action === "track-engine") {
    const { id, engine, status } = body;
    const { data: geo } = await db.from("geo_versions").select("engine_tracking").eq("id", id).eq("team_id", user.team_id).single();
    if (!geo) return NextResponse.json({ error: "GEO 版本不存在" }, { status: 404 });

    const tracking = (geo.engine_tracking as Array<Record<string, unknown>>) || [];
    const updated = tracking.map((t: Record<string, unknown>) =>
      t.engine === engine ? { ...t, status, checked_at: new Date().toISOString().substring(0, 10) } : t
    );

    await db.from("geo_versions").update({ engine_tracking: updated, updated_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ data: { engine_tracking: updated } });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of ["title", "content", "geo_summary", "geo_title", "status", "framework", "source_type"]) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  const { data, error } = await db.from("geo_versions").update(updates).eq("id", body.id).eq("team_id", user.team_id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}
