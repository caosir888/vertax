import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { getPlanLimits } from "@/lib/plans";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { data: tenant, error } = await getSupabase()
    .from("tenants")
    .select("plan, subscription_status, trial_ends_at, subscription_ends_at")
    .eq("id", user.team_id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 检查试用是否已过期，自动更新
  if (tenant.subscription_status === "trial" && tenant.trial_ends_at) {
    if (new Date(tenant.trial_ends_at) < new Date()) {
      await getSupabase()
        .from("tenants")
        .update({ subscription_status: "expired" })
        .eq("id", user.team_id);
      tenant.subscription_status = "expired";
    }
  }

  const limits = getPlanLimits(tenant.plan);

  return NextResponse.json({
    data: {
      plan: tenant.plan,
      subscription_status: tenant.subscription_status,
      trial_ends_at: tenant.trial_ends_at,
      subscription_ends_at: tenant.subscription_ends_at,
      limits,
    },
  });
}
