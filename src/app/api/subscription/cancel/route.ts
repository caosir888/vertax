import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";

export async function POST() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { error } = await getSupabase()
    .from("tenants")
    .update({ subscription_status: "cancelled", subscription_ends_at: new Date().toISOString() })
    .eq("id", user.team_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
