import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// PATCH /api/buzz/accounts/[id] — 更新接入凭证/状态
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
  if (body.access_token !== undefined) updateData.access_token = body.access_token;
  if (body.account_name !== undefined) updateData.account_name = body.account_name;
  if (body.account_handle !== undefined) updateData.account_handle = body.account_handle;
  if (body.status !== undefined) updateData.status = body.status;

  const { data, error } = await supabase
    .from("buzz_accounts")
    .update(updateData)
    .eq("id", id)
    .eq("team_id", user.team_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// DELETE /api/buzz/accounts/[id] — 删除授权账号
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const supabase = getSupabase();
  const { id } = await params;

  const { error } = await supabase
    .from("buzz_accounts")
    .delete()
    .eq("id", id)
    .eq("team_id", user.team_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: { success: true } });
}
