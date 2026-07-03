import { Resend } from "resend";

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "your-resend-api-key") return null;
  return new Resend(apiKey);
}

// ======================== 邮件模板 ========================

function welcomeEmailHtml(name: string, appUrl: string) {
  return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #7c3aed; margin: 0;">VertaX</h1>
  </div>
  <h2 style="color: #1f2937;">欢迎加入，${name}！</h2>
  <p style="color: #4b5563; line-height: 1.6;">
    你已经成功注册 VertaX。开始用 AI 驱动你的 B2B 获客之旅吧。
  </p>
  <div style="margin: 24px 0;">
    <a href="${appUrl}/dashboard" style="display: inline-block; padding: 12px 24px; background: #7c3aed; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">
      进入工作台
    </a>
  </div>
  <p style="color: #9ca3af; font-size: 14px;">
    如果按钮无法点击，请复制以下链接到浏览器：<br/>
    ${appUrl}/dashboard
  </p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
  <p style="color: #9ca3af; font-size: 12px;">
    VertaX — AI 驱动的 B2B 获客平台
  </p>
</div>`.trim();
}

function weeklyReportHtml(
  name: string,
  data: { newLeads: number; newContent: number; wonDeals: number },
  appUrl: string
) {
  return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #7c3aed; margin: 0;">VertaX 周报</h1>
  </div>
  <h2 style="color: #1f2937;">你好，${name}</h2>
  <p style="color: #4b5563; line-height: 1.6;">以下是本周你的团队数据汇总：</p>
  <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
    <tr>
      <td style="padding: 16px; background: #f3f4f6; border-radius: 8px; text-align: center;">
        <div style="font-size: 28px; font-weight: 700; color: #7c3aed;">${data.newLeads}</div>
        <div style="font-size: 14px; color: #6b7280;">新线索</div>
      </td>
      <td style="width: 16px;"></td>
      <td style="padding: 16px; background: #f3f4f6; border-radius: 8px; text-align: center;">
        <div style="font-size: 28px; font-weight: 700; color: #059669;">${data.newContent}</div>
        <div style="font-size: 14px; color: #6b7280;">新内容</div>
      </td>
      <td style="width: 16px;"></td>
      <td style="padding: 16px; background: #f3f4f6; border-radius: 8px; text-align: center;">
        <div style="font-size: 28px; font-weight: 700; color: #2563eb;">${data.wonDeals}</div>
        <div style="font-size: 14px; color: #6b7280;">赢单</div>
      </td>
    </tr>
  </table>
  <div style="margin: 24px 0;">
    <a href="${appUrl}/dashboard" style="display: inline-block; padding: 12px 24px; background: #7c3aed; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">
      查看完整报表
    </a>
  </div>
</div>`.trim();
}

function leadReminderHtml(
  name: string,
  leadName: string,
  leadCompany: string,
  followUpDate: string,
  appUrl: string
) {
  return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #1f2937;">跟进提醒</h2>
  <p style="color: #4b5563; line-height: 1.6;">
    ${name}，你有一条线索需要跟进：
  </p>
  <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p style="margin: 4px 0;"><strong>线索：</strong>${leadName}</p>
    <p style="margin: 4px 0;"><strong>公司：</strong>${leadCompany}</p>
    <p style="margin: 4px 0;"><strong>计划跟进：</strong>${followUpDate}</p>
  </div>
  <div style="margin: 24px 0;">
    <a href="${appUrl}/leads" style="display: inline-block; padding: 12px 24px; background: #f59e0b; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">
      查看线索
    </a>
  </div>
</div>`.trim();
}

// ======================== 发送接口 ========================

export async function sendWelcomeEmail(to: string, name: string) {
  const resend = getResend();
  if (!resend) return { sent: false, reason: "Resend 未配置" };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const { error } = await resend.emails.send({
      from: "VertaX <noreply@vertax.ai>",
      to,
      subject: "欢迎加入 VertaX！",
      html: welcomeEmailHtml(name, appUrl),
    });
    if (error) return { sent: false, reason: error.message };
    return { sent: true };
  } catch (err: unknown) {
    return { sent: false, reason: err instanceof Error ? err.message : "发送失败" };
  }
}

export async function sendWeeklyReport(
  to: string,
  name: string,
  data: { newLeads: number; newContent: number; wonDeals: number }
) {
  const resend = getResend();
  if (!resend) return { sent: false, reason: "Resend 未配置" };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const { error } = await resend.emails.send({
      from: "VertaX <noreply@vertax.ai>",
      to,
      subject: "VertaX 周报 — 本周数据汇总",
      html: weeklyReportHtml(name, data, appUrl),
    });
    if (error) return { sent: false, reason: error.message };
    return { sent: true };
  } catch (err: unknown) {
    return { sent: false, reason: err instanceof Error ? err.message : "发送失败" };
  }
}

export async function sendLeadReminder(
  to: string,
  name: string,
  leadName: string,
  leadCompany: string,
  followUpDate: string
) {
  const resend = getResend();
  if (!resend) return { sent: false, reason: "Resend 未配置" };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const { error } = await resend.emails.send({
      from: "VertaX <noreply@vertax.ai>",
      to,
      subject: `线索跟进提醒：${leadName}`,
      html: leadReminderHtml(name, leadName, leadCompany, followUpDate, appUrl),
    });
    if (error) return { sent: false, reason: error.message };
    return { sent: true };
  } catch (err: unknown) {
    return { sent: false, reason: err instanceof Error ? err.message : "发送失败" };
  }
}

export async function sendTeamInvite(to: string, inviterName: string, teamName: string, inviteUrl: string) {
  const resend = getResend();
  if (!resend) return { sent: false, reason: "Resend 未配置" };

  try {
    const { error } = await resend.emails.send({
      from: "VertaX <noreply@vertax.ai>",
      to,
      subject: `${inviterName} 邀请你加入 ${teamName}`,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #1f2937;">团队邀请</h2>
  <p style="color: #4b5563; line-height: 1.6;">
    ${inviterName} 邀请你加入 <strong>${teamName}</strong> 团队。
  </p>
  <div style="margin: 24px 0;">
    <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background: #7c3aed; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">
      接受邀请
    </a>
  </div>
</div>`.trim(),
    });
    if (error) return { sent: false, reason: error.message };
    return { sent: true };
  } catch (err: unknown) {
    return { sent: false, reason: err instanceof Error ? err.message : "发送失败" };
  }
}

// 检查 Resend 是否已配置
export function isEmailConfigured(): boolean {
  const apiKey = process.env.RESEND_API_KEY;
  return !!(apiKey && apiKey !== "your-resend-api-key");
}
