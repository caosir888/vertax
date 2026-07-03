import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { bulkSendCampaign } from "@/lib/email-campaign";

// GET /api/email/campaigns — 获取邮件活动列表
export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { data, error } = await getSupabase()
    .from("email_campaigns")
    .select("*")
    .eq("team_id", user.team_id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/email/campaigns — 创建或发送活动
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const { action, campaign_id, name, subject, template, lead_ids } = body;

  // 操作：发送活动
  if (action === "send" && campaign_id) {
    const { data: campaign } = await getSupabase()
      .from("email_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .eq("team_id", user.team_id)
      .maybeSingle();

    if (!campaign) {
      return NextResponse.json({ error: "活动不存在" }, { status: 404 });
    }

    // 查询线索
    let query = getSupabase().from("leads").select("*").eq("team_id", user.team_id);
    if (lead_ids?.length) {
      query = query.in("id", lead_ids);
    }
    const { data: leads } = await query;

    if (!leads?.length) {
      return NextResponse.json({ error: "没有可发送的线索" }, { status: 400 });
    }

    // 更新状态为发送中
    await getSupabase()
      .from("email_campaigns")
      .update({ status: "sending", updated_at: new Date().toISOString() })
      .eq("id", campaign_id);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const result = await bulkSendCampaign(campaign, leads, user.id, user.name, baseUrl);

    return NextResponse.json({ data: result });
  }

  // 操作：创建活动
  if (!name) {
    return NextResponse.json({ error: "活动名称不能为空" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("email_campaigns")
    .insert({
      team_id: user.team_id,
      user_id: user.id,
      name,
      subject: subject || "",
      template: template || "",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
