import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/memos/[id] — 获取单条备忘录
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;

  const { data: memo } = await getSupabase()
    .from("memos")
    .select("*")
    .eq("id", id)
    .eq("team_id", user.team_id) // 租户隔离：只能看本团队的
    .maybeSingle();

  if (!memo) {
    return NextResponse.json({ error: "备忘录不存在" }, { status: 404 });
  }

  return NextResponse.json({ data: memo });
}

// PATCH /api/memos/[id] — 编辑备忘录
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, string> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.content !== undefined) updates.content = body.content;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "没有要更新的字段" }, { status: 400 });
  }

  const { data: memo } = await getSupabase()
    .from("memos")
    .select("id")
    .eq("id", id)
    .eq("team_id", user.team_id)
    .maybeSingle();

  if (!memo) {
    return NextResponse.json({ error: "备忘录不存在" }, { status: 404 });
  }

  const { data, error } = await getSupabase()
    .from("memos")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// DELETE /api/memos/[id] — 删除备忘录
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;

  // 先验证这条备忘录属于当前团队
  const { data: memo } = await getSupabase()
    .from("memos")
    .select("id")
    .eq("id", id)
    .eq("team_id", user.team_id) // 租户隔离：只能删本团队的
    .maybeSingle();

  if (!memo) {
    return NextResponse.json({ error: "备忘录不存在或无权删除" }, { status: 404 });
  }

  const { error } = await getSupabase().from("memos").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
