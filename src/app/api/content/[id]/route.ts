import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";

// GET /api/content/[id] — 获取单条内容 + 版本列表
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;

  const { data: item, error } = await getSupabase()
    .from("contents")
    .select("*")
    .eq("id", id)
    .eq("team_id", user.team_id)
    .single();

  if (error || !item) {
    return NextResponse.json({ error: "内容不存在" }, { status: 404 });
  }

  // 加载版本列表
  const { data: versions } = await getSupabase()
    .from("content_versions")
    .select("*")
    .eq("content_id", id)
    .order("version_number", { ascending: false });

  return NextResponse.json({ data: { ...item, versions: versions || [] } });
}

// PATCH /api/content/[id] — 更新内容（自动保存版本）
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

  if (body.title !== undefined) updates.title = body.title;
  if (body.content !== undefined) updates.content = body.content;
  if (body.status !== undefined) updates.status = body.status;
  if (body.language !== undefined) updates.language = body.language;
  if (body.template_id !== undefined) updates.template_id = body.template_id;
  if (body.tags !== undefined) updates.tags = body.tags;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "没有要更新的字段" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  // 如果修改了内容正文，自动保存版本
  if (body.content !== undefined && body.save_version !== false) {
    const { data: current } = await getSupabase()
      .from("contents")
      .select("content")
      .eq("id", id)
      .eq("team_id", user.team_id)
      .single();

    if (current && current.content !== body.content) {
      const { data: versions } = await getSupabase()
        .from("content_versions")
        .select("version_number")
        .eq("content_id", id)
        .order("version_number", { ascending: false })
        .limit(1);

      const nextVersion = (versions?.[0]?.version_number || 0) + 1;

      await getSupabase()
        .from("content_versions")
        .insert({ content_id: id, version_number: nextVersion, content: current.content });
    }
  }

  const { data, error } = await getSupabase()
    .from("contents")
    .update(updates)
    .eq("id", id)
    .eq("team_id", user.team_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logActivity({ team_id: user.team_id!, user_id: user.id, user_name: user.name, action: "更新内容", target: data.title || id });

  return NextResponse.json({ data });
}

// DELETE /api/content/[id] — 删除内容（级联删除版本）
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
    .from("contents")
    .delete()
    .eq("id", id)
    .eq("team_id", user.team_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logActivity({ team_id: user.team_id!, user_id: user.id, user_name: user.name, action: "删除内容", target: id });

  return NextResponse.json({ data: "ok" });
}
