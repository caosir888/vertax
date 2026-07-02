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
    .eq("user_id", user.id)
    .maybeSingle();

  if (!memo) {
    return NextResponse.json({ error: "备忘录不存在" }, { status: 404 });
  }

  return NextResponse.json({ data: memo });
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

  // 先验证这条备忘录属于当前用户
  const { data: memo } = await getSupabase()
    .from("memos")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
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
