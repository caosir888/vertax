import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/sites — 站点列表
export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { data, error } = await getSupabase()
    .from("sites")
    .select("*")
    .eq("team_id", user.team_id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/sites — 新建站点（手动创建或保存）
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const { name = "我的独立站", template_id, pages = [], settings = {} } = body;

  if (!template_id) {
    return NextResponse.json({ error: "请选择模板" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("sites")
    .insert({
      team_id: user.team_id,
      user_id: user.id,
      name,
      template_id,
      pages: JSON.stringify(pages),
      settings: JSON.stringify(settings),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
