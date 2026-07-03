import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { getPlan } from "@/lib/plans";
import { getUserRole } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-logger";
import { sendNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  // 只有 owner 可以升级方案
  const role = await getUserRole(user.id, user.team_id!);
  if (role !== "owner") {
    return NextResponse.json({ error: "只有团队拥有者可以升级方案" }, { status: 403 });
  }

  const { plan: targetPlan } = await request.json();

  if (!targetPlan || !["pro", "enterprise"].includes(targetPlan)) {
    return NextResponse.json({ error: "无效的方案" }, { status: 400 });
  }

  const planInfo = getPlan(targetPlan);
  if (!planInfo) {
    return NextResponse.json({ error: "方案不存在" }, { status: 400 });
  }

  // 模拟支付：生成假交易ID
  const transactionId = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  // 更新团队方案
  const { error: updateError } = await getSupabase()
    .from("tenants")
    .update({
      plan: targetPlan,
      subscription_status: "active",
      trial_ends_at: null,
      subscription_ends_at: null,
    })
    .eq("id", user.team_id);

  if (updateError) {
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }

  // 记录订阅
  await getSupabase()
    .from("subscriptions")
    .insert({
      team_id: user.team_id,
      plan: targetPlan,
      amount: planInfo.price,
      transaction_id: transactionId,
      status: "success",
    });

  logActivity({
    team_id: user.team_id!,
    user_id: user.id,
    user_name: user.name,
    action: "升级方案",
    target: `${targetPlan} (${planInfo.priceLabel})`,
    details: `交易ID: ${transactionId}`,
  });

  sendNotification({
    team_id: user.team_id!,
    actor_id: user.id,
    title: "方案已升级",
    message: `已升级至 ${planInfo.name}（${planInfo.priceLabel}），交易ID: ${transactionId}`,
  });

  return NextResponse.json({
    data: {
      plan: targetPlan,
      subscription_status: "active",
      transaction_id: transactionId,
      amount: planInfo.price,
    },
  });
}
