import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// PATCH /api/team/members/[id] — 修改成员角色
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
  const { role } = body;

  if (!role || !["owner", "admin", "editor", "viewer"].includes(role)) {
    return NextResponse.json({ error: "无效的角色" }, { status: 400 });
  }

  // 验证该成员属于当前团队
  const { data: member } = await getSupabase()
    .from("team_members")
    .select("id, team_id, user_id, role")
    .eq("id", id)
    .eq("team_id", user.team_id)
    .maybeSingle();

  if (!member) {
    return NextResponse.json({ error: "成员不存在" }, { status: 404 });
  }

  // 不能修改自己的角色
  if (member.user_id === user.id) {
    return NextResponse.json({ error: "不能修改自己的角色" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("team_members")
    .update({ role })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// DELETE /api/team/members/[id] — 移除成员
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;

  // 验证该成员属于当前团队
  const { data: member } = await getSupabase()
    .from("team_members")
    .select("id, user_id, role")
    .eq("id", id)
    .eq("team_id", user.team_id)
    .maybeSingle();

  if (!member) {
    return NextResponse.json({ error: "成员不存在" }, { status: 404 });
  }

  // 不能移除自己
  if (member.user_id === user.id) {
    return NextResponse.json({ error: "不能移除自己" }, { status: 400 });
  }

  // 不能移除 owner
  if (member.role === "owner") {
    return NextResponse.json({ error: "不能移除团队拥有者" }, { status: 400 });
  }

  const { error } = await getSupabase().from("team_members").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
