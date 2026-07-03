import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { validateApiKey, extractApiKey } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";

// GET /api/v1/content — 获取内容列表
export async function GET(request: NextRequest) {
  const apiKey = extractApiKey(request);
  if (!apiKey) {
    return NextResponse.json({ error: "缺少 API Key" }, { status: 401 });
  }

  const auth = await validateApiKey(apiKey);
  if (!auth.valid || !auth.team_id) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const rl = rateLimit(`v1_content_${auth.team_id}`, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
  }

  const params = request.nextUrl.searchParams;
  const status = params.get("status");
  const language = params.get("language");
  const limit = Math.min(parseInt(params.get("limit") || "50"), 100);
  const offset = parseInt(params.get("offset") || "0");

  let query = getSupabase()
    .from("contents")
    .select("id, title, template_id, language, status, tags, created_at, updated_at")
    .eq("team_id", auth.team_id);

  if (status) query = query.eq("status", status);
  if (language) query = query.eq("language", language);

  const { data, error } = await query
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, pagination: { limit, offset } });
}

// POST /api/v1/content — 创建内容
export async function POST(request: NextRequest) {
  const apiKey = extractApiKey(request);
  if (!apiKey) {
    return NextResponse.json({ error: "缺少 API Key" }, { status: 401 });
  }

  const auth = await validateApiKey(apiKey);
  if (!auth.valid || !auth.team_id) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const rl = rateLimit(`v1_content_create_${auth.team_id}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
  }

  const body = await request.json();
  const { title, content, template_id = "", language = "zh-CN", tags = [] } = body;

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "title 和 content 不能为空" }, { status: 400 });
  }

  const { data: member } = await getSupabase()
    .from("team_members")
    .select("user_id")
    .eq("team_id", auth.team_id)
    .limit(1)
    .maybeSingle();

  const { data, error } = await getSupabase()
    .from("contents")
    .insert({
      team_id: auth.team_id,
      user_id: member?.user_id,
      title: title.trim(),
      content: content.trim(),
      template_id,
      language,
      tags,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
