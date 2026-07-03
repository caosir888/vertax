import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { checkTeamPermission } from "@/lib/team-guard";

// GET /api/webhooks/[id] — 获取单个 webhook
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;

  const { data, error } = await getSupabase()
    .from("webhooks")
    .select("id, name, url, events, is_active, secret, created_at")
    .eq("id", id)
    .eq("team_id", user.team_id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Webhook 不存在" }, { status: 404 });
  }

  // 脱敏 secret
  const masked = {
    ...data,
    secret: data.secret ? data.secret.substring(0, 8) + "***" : "",
  };

  return NextResponse.json({ data: masked });
}

// PATCH /api/webhooks/[id] — 更新 webhook
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const permit = await checkTeamPermission(user.id, user.team_id);
  if (!permit.allowed) {
    return NextResponse.json({ error: permit.error }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.url !== undefined) updateData.url = body.url;
  if (body.events !== undefined) updateData.events = body.events;
  if (body.is_active !== undefined) updateData.is_active = body.is_active;

  const { data, error } = await getSupabase()
    .from("webhooks")
    .update(updateData)
    .eq("id", id)
    .eq("team_id", user.team_id)
    .select("id, name, url, events, is_active, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// DELETE /api/webhooks/[id] — 删除 webhook
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const permit = await checkTeamPermission(user.id, user.team_id);
  if (!permit.allowed) {
    return NextResponse.json({ error: permit.error }, { status: 403 });
  }

  const { id } = await params;

  const { error } = await getSupabase()
    .from("webhooks")
    .delete()
    .eq("id", id)
    .eq("team_id", user.team_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
