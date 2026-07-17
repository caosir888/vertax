import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// PATCH /api/buzz/mentions/[id] — 更新内容（发布/改状态等）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const supabase = getSupabase();
  const { id } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.snippet !== undefined) updateData.snippet = body.snippet;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.platforms !== undefined) updateData.platforms = body.platforms;
  if (body.account_id !== undefined) updateData.account_id = body.account_id;
  if (body.sentiment !== undefined) updateData.sentiment = body.sentiment;

  const { data, error } = await supabase
    .from("buzz_mentions")
    .update(updateData)
    .eq("id", id)
    .eq("team_id", user.team_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// DELETE /api/buzz/mentions/[id] — 删除内容
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const supabase = getSupabase();
  const { id } = await params;

  const { error } = await supabase
    .from("buzz_mentions")
    .delete()
    .eq("id", id)
    .eq("team_id", user.team_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: { success: true } });
}
