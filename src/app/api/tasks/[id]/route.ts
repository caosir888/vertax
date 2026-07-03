import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { sendNotification } from "@/lib/notifications";

// PATCH /api/tasks/[id] — 更新任务
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

  if (body.title !== undefined) updates.title = body.title?.trim();
  if (body.description !== undefined) updates.description = body.description;
  if (body.status !== undefined) updates.status = body.status;
  if (body.priority !== undefined) updates.priority = body.priority;
  if (body.assignee_id !== undefined) updates.assignee_id = body.assignee_id;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await getSupabase()
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .eq("team_id", user.team_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.status) {
    const statusLabels: Record<string, string> = { pending: "待处理", in_progress: "进行中", done: "已完成" };
    sendNotification({
      team_id: user.team_id!,
      actor_id: user.id,
      title: `任务状态更新`,
      message: `「${data.title}」→ ${statusLabels[body.status] || body.status}`,
    });
  }

  return NextResponse.json({ data });
}

// DELETE /api/tasks/[id] — 删除任务
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
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("team_id", user.team_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: "ok" });
}
