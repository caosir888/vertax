import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { data: adminUser } = await getSupabase()
    .from("users")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single();

  if (!adminUser?.is_platform_admin) {
    return NextResponse.json({ error: "无权限访问" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, unknown> = {};
  const supabase = getSupabase();

  if (body.is_disabled !== undefined) updates.is_disabled = body.is_disabled;
  if (body.is_platform_admin !== undefined) updates.is_platform_admin = body.is_platform_admin;

  // 更新用户表
  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // 更新团队角色
  if (body.team_id && body.role) {
    const { error: roleError } = await supabase
      .from("team_members")
      .update({ role: body.role })
      .eq("user_id", id)
      .eq("team_id", body.team_id);

    if (roleError) {
      return NextResponse.json({ error: roleError.message }, { status: 500 });
    }
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, is_disabled, is_platform_admin")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
