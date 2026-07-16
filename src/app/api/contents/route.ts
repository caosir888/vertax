import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/contents — 列出内容
export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const db = getSupabase();
  const url = request.nextUrl.searchParams;
  const status = url.get("status");
  const search = url.get("search");
  const category = url.get("category");

  let query = db.from("contents")
    .select("id,title,slug,status,category,tags,language,publish_date,created_at,updated_at,seo_title,seo_description")
    .eq("team_id", user.team_id)
    .order("updated_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (category) query = query.eq("category", category);
  if (search) query = query.or(`title.ilike.%${search}%,seo_title.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data || [] });
}

// POST /api/contents — 创建内容
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const db = getSupabase();

  const { data, error } = await db.from("contents").insert({
    team_id: user.team_id,
    user_id: user.id,
    title: body.title || "未命名",
    content: body.content || "",
    slug: body.slug || "",
    seo_title: body.seo_title || "",
    seo_description: body.seo_description || "",
    outline: body.outline || [],
    category: body.category || "",
    status: body.status || "draft",
    tags: body.tags || [],
    language: body.language || "zh-CN",
    publish_date: body.publish_date || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
