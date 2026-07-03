import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/email/campaigns/[id] — 获取活动详情（含发送记录）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;

  const { data: campaign, error } = await getSupabase()
    .from("email_campaigns")
    .select("*")
    .eq("id", id)
    .eq("team_id", user.team_id)
    .maybeSingle();

  if (error || !campaign) {
    return NextResponse.json({ error: "活动不存在" }, { status: 404 });
  }

  // 获取发送记录
  const { data: sends } = await getSupabase()
    .from("email_sends")
    .select("*")
    .eq("campaign_id", id)
    .order("created_at", { ascending: false })
    .limit(100);

  return NextResponse.json({ data: { ...campaign, sends } });
}

// PATCH /api/email/campaigns/[id] — 更新活动
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) updateData.name = body.name;
  if (body.subject !== undefined) updateData.subject = body.subject;
  if (body.template !== undefined) updateData.template = body.template;
  if (body.status !== undefined) updateData.status = body.status;

  const { error } = await getSupabase()
    .from("email_campaigns")
    .update(updateData)
    .eq("id", id)
    .eq("team_id", user.team_id);

  if (error) {
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/email/campaigns/[id] — 删除活动
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;

  const { error } = await getSupabase()
    .from("email_campaigns")
    .delete()
    .eq("id", id)
    .eq("team_id", user.team_id);

  if (error) {
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
