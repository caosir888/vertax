import { NextRequest, NextResponse } from "next/server";
import { unsubscribe } from "@/lib/email-campaign";

// GET /api/email/unsubscribe — 退订页面
export async function GET(request: NextRequest) {
  const teamId = request.nextUrl.searchParams.get("team_id");
  const email = request.nextUrl.searchParams.get("email");

  if (!teamId || !email) {
    return NextResponse.json({ error: "参数不完整" }, { status: 400 });
  }

  await unsubscribe(teamId, email);

  return new NextResponse(
    `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>退订成功</title></head>
     <body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f4f4f5">
       <div style="text-align:center;background:#fff;padding:40px;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
         <div style="font-size:40px;margin-bottom:16px">📧</div>
         <h1 style="font-size:20px;color:#18181b;margin:0 0 8px">退订成功</h1>
         <p style="font-size:14px;color:#71717a;margin:0">邮箱 ${email} 已成功退订，不会再收到来自此团队的营销邮件。</p>
       </div>
     </body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
