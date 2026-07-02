import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/content — 获取内容列表（支持筛选和搜索）
// Query: ?status=draft&language=zh-CN&template_id=product-intro&search=关键词
export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const status = params.get("status");
  const language = params.get("language");
  const template_id = params.get("template_id");
  const search = params.get("search");

  let query = getSupabase()
    .from("contents")
    .select("*")
    .eq("team_id", user.team_id);

  if (status) query = query.eq("status", status);
  if (language) query = query.eq("language", language);
  if (template_id) query = query.eq("template_id", template_id);
  if (search) query = query.ilike("title", `%${search}%`);

  const { data, error } = await query.order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/content — 保存内容
// Body: { title, content, template_id?, language?, status?, tags? }
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const { title = "未命名", content = "", template_id = "", language = "zh-CN", status = "draft", tags = [] } = body;

  if (!content.trim()) {
    return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("contents")
    .insert({
      team_id: user.team_id,
      user_id: user.id,
      title,
      content,
      template_id,
      language,
      status,
      tags,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
