import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { chat } from "@/lib/llm";
import { logActivity } from "@/lib/activity-logger";

// GET /api/growth/geo — GEO 多语言版本列表
export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const db = getSupabase();
  const url = request.nextUrl.searchParams;
  const language = url.get("language");
  const status = url.get("status");

  let query = db
    .from("geo_versions")
    .select("*")
    .eq("team_id", user.team_id)
    .order("created_at", { ascending: false });

  if (language) query = query.eq("language", language);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}

// POST /api/growth/geo — 创建/翻译 GEO 版本
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const db = getSupabase();

  const action = body.action || "create";

  if (action === "translate") {
    // AI 翻译内容
    const { data: brief } = await db
      .from("content_briefs")
      .select("title, generated_content")
      .eq("id", body.brief_id)
      .eq("team_id", user.team_id)
      .single();

    if (!brief?.generated_content) {
      return NextResponse.json({ error: "源内容未生成，请先生成内容" }, { status: 400 });
    }

    const targetLang = body.language || "en";
    const langNames: Record<string, string> = { en: "英语", ja: "日语", ko: "韩语", de: "德语", fr: "法语", es: "西班牙语", pt: "葡萄牙语", ar: "阿拉伯语", ru: "俄语", "zh-TW": "繁体中文" };

    const prompt = `将以下中文内容翻译为${langNames[targetLang] || targetLang}，保持Markdown格式和结构不变，专业术语翻译准确：

${brief.generated_content.substring(0, 4000)}`;

    try {
      const translated = await chat([
        { role: "system", content: `你是一个专业的B2B内容翻译专家，擅长将中文营销内容翻译为${langNames[targetLang] || targetLang}。保持原有格式。` },
        { role: "user", content: prompt },
      ]);

      const { data, error } = await db
        .from("geo_versions")
        .insert({
          team_id: user.team_id,
          user_id: user.id,
          brief_id: body.brief_id,
          language: targetLang,
          region: body.region || "",
          title: brief.title ? `${brief.title} (${langNames[targetLang] || targetLang})` : "",
          content: translated,
          status: "translated",
          source: "ai",
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      logActivity({
        team_id: user.team_id!,
        user_id: user.id,
        user_name: user.name,
        action: "geo_translate",
        target: data.id,
        details: `${brief.title} → ${targetLang}`,
      });

      return NextResponse.json({ data }, { status: 201 });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "未知错误";
      return NextResponse.json({ error: "AI 翻译失败: " + msg }, { status: 500 });
    }
  }

  // 手动创建
  const { data, error } = await db
    .from("geo_versions")
    .insert({
      team_id: user.team_id,
      user_id: user.id,
      content_id: body.content_id || null,
      brief_id: body.brief_id || null,
      language: body.language || "en",
      region: body.region || "",
      title: body.title || "",
      content: body.content || "",
      status: "draft",
      source: "manual",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

// PATCH /api/growth/geo — 更新 GEO 版本
export async function PATCH(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const db = getSupabase();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of ["title", "content", "status", "language", "region"]) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  const { data, error } = await db
    .from("geo_versions")
    .update(updates)
    .eq("id", body.id)
    .eq("team_id", user.team_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
