import { getSupabase } from "@/lib/supabase";
import { getPlanLimits } from "@/lib/plans";

export type PlanAction = "create_content" | "create_site" | "add_member" | "ai_generate";

export async function checkPlanLimit(
  teamId: string,
  action: PlanAction
): Promise<{ allowed: boolean; error?: string }> {
  const supabase = getSupabase();

  // 查询团队方案
  const { data: tenant } = await supabase
    .from("tenants")
    .select("plan, subscription_status, trial_ends_at")
    .eq("id", teamId)
    .single();

  if (!tenant) return { allowed: false, error: "团队不存在" };

  // 检查试用是否过期
  if (tenant.subscription_status === "trial" && tenant.trial_ends_at) {
    if (new Date(tenant.trial_ends_at) < new Date()) {
      // 自动标记为过期
      await supabase.from("tenants").update({ subscription_status: "expired" }).eq("id", teamId);
      return { allowed: false, error: "试用期已结束，请升级方案" };
    }
  }

  // 已取消/过期
  if (tenant.subscription_status === "cancelled" || tenant.subscription_status === "expired") {
    return { allowed: false, error: "订阅已失效，请续费升级" };
  }

  const limits = getPlanLimits(tenant.plan);

  switch (action) {
    case "create_content": {
      const { count } = await supabase
        .from("contents")
        .select("*", { count: "exact", head: true })
        .eq("team_id", teamId);
      if (count !== null && count >= limits.maxContent) {
        return { allowed: false, error: `当前方案最多创建 ${limits.maxContent} 条内容，请升级` };
      }
      break;
    }
    case "create_site": {
      const { count } = await supabase
        .from("sites")
        .select("*", { count: "exact", head: true })
        .eq("team_id", teamId);
      if (count !== null && count >= limits.maxSites) {
        return { allowed: false, error: `当前方案最多创建 ${limits.maxSites} 个独立站，请升级` };
      }
      break;
    }
    case "add_member": {
      const { count } = await supabase
        .from("team_members")
        .select("*", { count: "exact", head: true })
        .eq("team_id", teamId);
      if (count !== null && count >= limits.maxMembers) {
        return { allowed: false, error: `当前方案最多 ${limits.maxMembers} 名成员，请升级` };
      }
      break;
    }
    case "ai_generate": {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("contents")
        .select("*", { count: "exact", head: true })
        .eq("team_id", teamId)
        .gte("created_at", today.toISOString());
      if (count !== null && count >= limits.maxAIGenerations) {
        return { allowed: false, error: `今日 AI 生成次数已达上限（${limits.maxAIGenerations} 次），请升级` };
      }
      break;
    }
  }

  return { allowed: true };
}
