import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { getUserRole } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-logger";

export async function POST() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  // 只有 owner 可以取消订阅
  const role = await getUserRole(user.id, user.team_id!);
  if (role !== "owner") {
    return NextResponse.json({ error: "只有团队拥有者可以取消订阅" }, { status: 403 });
  }

  const { error } = await getSupabase()
    .from("tenants")
    .update({ subscription_status: "cancelled", subscription_ends_at: new Date().toISOString() })
    .eq("id", user.team_id);

  if (error) {
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }

  logActivity({
    team_id: user.team_id!,
    user_id: user.id,
    user_name: user.name,
    action: "取消订阅",
    target: "subscription",
  });

  return NextResponse.json({ data: "ok" });
}
