import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendWelcomeEmail, sendLeadReminder, isEmailConfigured } from "@/lib/email";

// GET /api/email — 检查邮件配置状态
export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  return NextResponse.json({ configured: isEmailConfigured() });
}

// POST /api/email — 发送测试邮件
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json({ error: "邮件服务未配置，请设置 RESEND_API_KEY" }, { status: 400 });
  }

  const body = await request.json();
  const { type } = body;

  let result;
  switch (type) {
    case "welcome":
      result = await sendWelcomeEmail(user.email, user.name);
      break;
    case "lead-reminder":
      result = await sendLeadReminder(
        user.email,
        user.name,
        body.leadName || "测试线索",
        body.leadCompany || "测试公司",
        body.followUpDate || new Date().toLocaleDateString("zh-CN")
      );
      break;
    default:
      return NextResponse.json({ error: "未知的邮件类型" }, { status: 400 });
  }

  if (!result.sent) {
    return NextResponse.json({ error: result.reason }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
