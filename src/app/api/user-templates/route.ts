import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/user-templates — 获取自定义模板列表
export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { data, error } = await getSupabase()
    .from("user_templates")
    .select("*")
    .eq("team_id", user.team_id)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

// POST /api/user-templates — 创建自定义模板
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = await request.json();
  const { name, description = "", category = "custom", variables = [], system_prompt = "", user_prompt = "" } = body;

  if (!name?.trim()) return NextResponse.json({ error: "模板名称不能为空" }, { status: 400 });

  const { data, error } = await getSupabase()
    .from("user_templates")
    .insert({
      team_id: user.team_id,
      user_id: user.id,
      name: name.trim(),
      description,
      category,
      variables,
      system_prompt,
      user_prompt,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data }, { status: 201 });
}

// PATCH /api/user-templates — 更新自定义模板
export async function PATCH(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: "缺少模板 ID" }, { status: 400 });

  const allowed = ["name", "description", "category", "variables", "system_prompt", "user_prompt"];
  const filtered: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (updates[key] !== undefined) filtered[key] = updates[key];
  }

  const { data, error } = await getSupabase()
    .from("user_templates")
    .update(filtered)
    .eq("id", id)
    .eq("team_id", user.team_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

// DELETE /api/user-templates — 删除自定义模板
export async function DELETE(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const url = request.nextUrl;
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少模板 ID" }, { status: 400 });

  const { error } = await getSupabase()
    .from("user_templates")
    .delete()
    .eq("id", id)
    .eq("team_id", user.team_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: { deleted: true } });
}
