import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  // 验证平台管理员
  const { data: adminUser } = await getSupabase()
    .from("users")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single();

  if (!adminUser?.is_platform_admin) {
    return NextResponse.json({ error: "无权限访问" }, { status: 403 });
  }

  const supabase = getSupabase();

  // 总租户数
  const { count: totalTenants } = await supabase
    .from("tenants")
    .select("*", { count: "exact", head: true });

  // 总用户数
  const { count: totalUsers } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  // 各方案分布
  const { data: planDistribution } = await supabase
    .from("tenants")
    .select("plan, subscription_status");

  const planCount: Record<string, number> = {};
  const statusCount: Record<string, number> = {};
  for (const t of planDistribution || []) {
    planCount[t.plan] = (planCount[t.plan] || 0) + 1;
    statusCount[t.subscription_status] = (statusCount[t.subscription_status] || 0) + 1;
  }

  // 本月新增租户
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const { count: monthTenants } = await supabase
    .from("tenants")
    .select("*", { count: "exact", head: true })
    .gte("created_at", monthStart.toISOString());

  // 估算 MRR（月经常性收入）
  const activePro = planCount["pro"] || 0;
  const activeEnterprise = planCount["enterprise"] || 0;
  const mrr = activePro * 29 + activeEnterprise * 99;

  return NextResponse.json({
    data: {
      totalTenants: totalTenants || 0,
      totalUsers: totalUsers || 0,
      monthTenants: monthTenants || 0,
      mrr,
      planCount,
      statusCount,
    },
  });
}
