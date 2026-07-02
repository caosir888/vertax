import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/sites/[id] — 获取站点详情
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;

  const { data, error } = await getSupabase()
    .from("sites")
    .select("*")
    .eq("id", id)
    .eq("team_id", user.team_id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "站点不存在" }, { status: 404 });
  }

  return NextResponse.json({ data });
}

// PATCH /api/sites/[id] — 更新站点
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
  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) updates.name = body.name;
  if (body.pages !== undefined) updates.pages = JSON.stringify(body.pages);
  if (body.settings !== undefined) updates.settings = JSON.stringify(body.settings);
  if (body.status !== undefined) updates.status = body.status;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "没有要更新的字段" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await getSupabase()
    .from("sites")
    .update(updates)
    .eq("id", id)
    .eq("team_id", user.team_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// DELETE /api/sites/[id] — 删除站点
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
    .from("sites")
    .delete()
    .eq("id", id)
    .eq("team_id", user.team_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: "ok" });
}
