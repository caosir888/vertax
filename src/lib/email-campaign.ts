import { getSupabase } from "@/lib/supabase";
import { chat } from "@/lib/llm";
import { isEmailConfigured } from "@/lib/email";
import { logActivity } from "@/lib/activity-logger";
import { Resend } from "resend";

export interface Campaign {
  id?: string;
  team_id: string;
  user_id: string;
  name: string;
  subject: string;
  template: string;
  status: string;
  lead_count?: number;
  sent_count?: number;
  open_count?: number;
  click_count?: number;
  created_at?: string;
}

export interface EmailSend {
  id?: string;
  campaign_id: string;
  team_id: string;
  lead_id?: string;
  lead_email: string;
  subject: string;
  body: string;
  status: string;
  metadata?: Record<string, unknown>;
}

// 用 LLM 基于线索信息生成个性化邮件
export async function generatePersonalizedEmail(
  lead: { name: string; company: string; email: string; notes: string },
  campaignTemplate: string,
  campaignSubject: string
): Promise<{ subject: string; body: string }> {
  const prompt = `你是一个专业的 B2B 邮件营销专家。请基于以下信息，生成一封个性化销售邮件。

## 收件人信息
- 姓名: ${lead.name}
- 公司: ${lead.company || "未知"}
- 备注: ${lead.notes || "无"}

## 邮件模板
主题: ${campaignSubject}
模板: ${campaignTemplate}

## 要求
1. 将模板中的占位符（如 {姓名}、{公司}）替换为实际信息
2. 保持专业、简洁的风格
3. 加入适当的个性化元素
4. 邮件正文不要使用 markdown 格式，纯文本即可
5. 返回 JSON 格式：{"subject": "个性化主题", "body": "个性化正文"}`;

  const response = await chat([
    { role: "system", content: "你是一个专业的 B2B 邮件营销专家。请严格按照 JSON 格式返回，不要包含 JSON 之外的任何内容。" },
    { role: "user", content: prompt },
  ]);

  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    // 回退到模板直接替换
    const body = campaignTemplate
      .replace(/\{姓名\}/g, lead.name)
      .replace(/\{公司\}/g, lead.company || "")
      .replace(/\{邮箱\}/g, lead.email);
    const subject = campaignSubject
      .replace(/\{姓名\}/g, lead.name)
      .replace(/\{公司\}/g, lead.company || "");
    return { subject, body };
  }
}

// 检查邮件是否已退订
export async function isUnsubscribed(teamId: string, email: string): Promise<boolean> {
  const { data } = await getSupabase()
    .from("email_unsubscribes")
    .select("id")
    .eq("team_id", teamId)
    .eq("email", email)
    .maybeSingle();
  return !!data;
}

// 退订
export async function unsubscribe(teamId: string, email: string, reason?: string) {
  await getSupabase()
    .from("email_unsubscribes")
    .upsert({ team_id: teamId, email, reason: reason || "" }, { onConflict: "team_id,email" });
}

// 生成追踪像素 URL
export function trackingPixelUrl(sendId: string, baseUrl: string): string {
  return `${baseUrl}/api/email/track/${sendId}/open`;
}

// 生成点击追踪 URL
export function trackingClickUrl(sendId: string, targetUrl: string, baseUrl: string): string {
  const encoded = encodeURIComponent(targetUrl);
  return `${baseUrl}/api/email/track/${sendId}/click?url=${encoded}`;
}

// 发送活动邮件给单个线索
export async function sendCampaignEmail(
  campaign: Campaign,
  lead: { id: string; name: string; company: string; email: string; notes: string },
  userId: string,
  userName: string,
  baseUrl: string
): Promise<{ sent: boolean; sendId?: string; error?: string }> {
  if (!isEmailConfigured()) {
    return { sent: false, error: "邮件服务未配置" };
  }

  // 检查退订
  if (await isUnsubscribed(campaign.team_id, lead.email)) {
    return { sent: false, error: "该邮箱已退订" };
  }

  // 生成个性化内容
  const { subject, body } = await generatePersonalizedEmail(lead, campaign.template, campaign.subject);

  // 插入发送记录
  const { data: sendRecord, error: insertError } = await getSupabase()
    .from("email_sends")
    .insert({
      campaign_id: campaign.id,
      team_id: campaign.team_id,
      lead_id: lead.id,
      lead_email: lead.email,
      subject,
      body,
      status: "sent",
      metadata: { lead_name: lead.name, lead_company: lead.company },
    })
    .select("id")
    .single();

  if (insertError) {
    return { sent: false, error: "创建发送记录失败" };
  }

  // 生成追踪内容和发送
  const trackingImg = `<img src="${trackingPixelUrl(sendRecord.id, baseUrl)}" width="1" height="1" style="display:none" alt="" />`;
  const unsubscribeLink = `${baseUrl}/api/email/unsubscribe?team_id=${campaign.team_id}&email=${encodeURIComponent(lead.email)}`;
  const fullBody = body + `\n\n---\n<a href="${unsubscribeLink}" style="color:#999;font-size:12px">退订此类邮件</a>\n${trackingImg}`;

  let sendResult: { sent: boolean; reason?: string };
  try {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    await resend.emails.send({
      from: "智客 <noreply@vertax.ai>",
      to: lead.email,
      subject,
      html: fullBody.replace(/\n/g, "<br>"),
    });
    sendResult = { sent: true };
  } catch (err: unknown) {
    sendResult = { sent: false, reason: err instanceof Error ? err.message : "发送失败" };
  }

  if (!sendResult.sent) {
    return { sent: false, sendId: sendRecord.id, error: sendResult.reason };
  }

  // 更新活动统计
  await getSupabase()
    .from("email_campaigns")
    .update({
      sent_count: (campaign.sent_count || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaign.id);

  logActivity({
    team_id: campaign.team_id,
    user_id: userId,
    user_name: userName,
    action: "发送活动邮件",
    target: `${lead.name} (${lead.company})`,
    details: `活动: ${campaign.name}`,
  });

  return { sent: true, sendId: sendRecord.id };
}

// 批量发送活动邮件
export async function bulkSendCampaign(
  campaign: Campaign,
  leads: { id: string; name: string; company: string; email: string; notes: string }[],
  userId: string,
  userName: string,
  baseUrl: string
): Promise<{ total: number; sent: number; errors: string[] }> {
  let sent = 0;
  const errors: string[] = [];

  for (let i = 0; i < leads.length; i++) {
    const result = await sendCampaignEmail(campaign, leads[i], userId, userName, baseUrl);
    if (result.sent) {
      sent++;
    } else if (result.error) {
      errors.push(`${leads[i].email}: ${result.error}`);
    }
    // 控制发送速率：每 0.5 秒一封
    if (i < leads.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // 更新状态
  await getSupabase()
    .from("email_campaigns")
    .update({
      status: "sent",
      lead_count: leads.length,
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaign.id);

  return { total: leads.length, sent, errors };
}

// 记录邮件打开
export async function recordOpen(sendId: string) {
  const { data } = await getSupabase()
    .from("email_sends")
    .select("id, status")
    .eq("id", sendId)
    .maybeSingle();

  if (!data) return;

  await getSupabase()
    .from("email_sends")
    .update({ status: "opened", opened_at: new Date().toISOString() })
    .eq("id", sendId);

  // 更新活动计数
  if (data.status === "sent") {
    const { data: send } = await getSupabase()
      .from("email_sends")
      .select("campaign_id")
      .eq("id", sendId)
      .maybeSingle();

    if (send) {
      const { data: campaign } = await getSupabase()
        .from("email_campaigns")
        .select("open_count")
        .eq("id", send.campaign_id)
        .maybeSingle();

      if (campaign) {
        await getSupabase()
          .from("email_campaigns")
          .update({
            open_count: (campaign.open_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", send.campaign_id);
      }
    }
  }
}

// 记录邮件点击
export async function recordClick(sendId: string) {
  const { data } = await getSupabase()
    .from("email_sends")
    .select("id, status, campaign_id")
    .eq("id", sendId)
    .maybeSingle();

  if (!data) return;

  await getSupabase()
    .from("email_sends")
    .update({ status: "clicked", clicked_at: new Date().toISOString() })
    .eq("id", sendId);

  // 更新活动计数
  if (data.status === "sent" || data.status === "opened") {
    const supabase = getSupabase();
    const { data: campaign } = await supabase
      .from("email_campaigns")
      .select("click_count")
      .eq("id", data.campaign_id)
      .single();

    if (campaign) {
      await supabase
        .from("email_campaigns")
        .update({
          click_count: (campaign.click_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.campaign_id);
    }
  }
}
