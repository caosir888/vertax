import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { chat } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatRequestBody {
  question: string;
  session_id?: string;
  history?: { role: "user" | "assistant"; content: string }[];
}

// POST /api/sites/[id]/chat — 独立站公开聊天（无需登录）
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const { question, session_id, history } = body;

  if (!question || !question.trim()) {
    return NextResponse.json({ error: "问题不能为空" }, { status: 400 });
  }

  const { data: site, error } = await getSupabase()
    .from("sites")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !site) {
    return NextResponse.json({ error: "站点不存在" }, { status: 404 });
  }

  const pages: { title: string; content: string }[] =
    typeof site.pages === "string" ? JSON.parse(site.pages) : site.pages;
  const settings: Record<string, unknown> =
    typeof site.settings === "string" ? JSON.parse(site.settings) : site.settings;

  if (!settings?.enableChat) {
    return NextResponse.json({ error: "该站点未开启在线咨询" }, { status: 403 });
  }

  const companyName = String(settings.companyName || "本站");
  const siteContext = (pages || [])
    .map((p: { title: string; content: string }) => `[${p.title}]\n${p.content}`)
    .join("\n\n");

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    {
      role: "system",
      content: `你是${companyName}的在线客服助手。请根据以下网站内容回答访客的问题。

网站内容：
${siteContext}

规则：
1. 只根据提供的网站内容回答，不要编造信息
2. 如果网站内容中没有相关信息，请礼貌地说"抱歉，我暂时无法回答这个问题，建议您通过联系方式直接咨询"
3. 回答要友好、专业、简洁，用中文
4. 适当引导访客了解更多产品或联系公司`,
    },
  ];

  if (history && Array.isArray(history)) {
    for (const msg of history.slice(-10)) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
  }

  messages.push({ role: "user", content: question.trim() });

  try {
    const answer = await chat(messages);

    const sid =
      session_id ||
      `site_${id}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    return NextResponse.json({
      data: { answer, session_id: sid },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI 服务暂时不可用" },
      { status: 500 }
    );
  }
}
