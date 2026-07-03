import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";

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

  if (body.plan !== undefined) updates.plan = body.plan;
  if (body.subscription_status !== undefined) updates.subscription_status = body.subscription_status;

  const { data, error } = await getSupabase()
    .from("tenants")
    .update(updates)
    .eq("id", id)
    .select("id, name, plan, subscription_status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logActivity({
    team_id: id,
    user_id: user.id,
    user_name: user.name,
    action: "管理员修改租户",
    target: data.name,
    details: `方案: ${data.plan}, 状态: ${data.subscription_status}`,
  });

  return NextResponse.json({ data });
}
