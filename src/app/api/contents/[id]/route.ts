import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { chat } from "@/lib/llm";
import { logActivity } from "@/lib/activity-logger";

// GET /api/contents/[id] — 获取单个内容
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { data, error } = await getSupabase()
    .from("contents").select("*").eq("id", id).eq("team_id", user.team_id).single();

  if (error || !data) return NextResponse.json({ error: "内容不存在" }, { status: 404 });
  return NextResponse.json({ data });
}

// PATCH /api/contents/[id] — 更新内容
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = await request.json();
  const db = getSupabase();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of ["title", "content", "slug", "seo_title", "seo_description", "outline", "category", "status", "tags", "language", "publish_date"]) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  const { data, error } = await db.from("contents").update(updates).eq("id", id).eq("team_id", user.team_id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logActivity({ team_id: user.team_id!, user_id: user.id, user_name: user.name, action: "update_content", target: id, details: (data.title as string) || "" });
  return NextResponse.json({ data });
}

// POST /api/contents/[id] — 操作
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = await request.json();
  const action = body.action || request.nextUrl.searchParams.get("action");

  if (action === "generate-outline") {
    return handleGenerateOutline(id, user, body);
  }
  if (action === "generate-content") {
    return handleGenerateContent(id, user, body);
  }

  return NextResponse.json({ error: "无效操作" }, { status: 400 });
}

async function handleGenerateOutline(id: string, user: { team_id?: string; id: string; name: string }, body: { topic?: string; keywords?: string }) {
  const db = getSupabase();
  const { data: content } = await db.from("contents").select("title,content").eq("id", id).eq("team_id", user.team_id).single();
  if (!content) return NextResponse.json({ error: "内容不存在" }, { status: 404 });

  const topic = body.topic || (content.title as string);
  const keywords = body.keywords || "";

  const prompt = `你是一个B2B内容策略专家。请为以下主题生成内容大纲。

主题: ${topic}
${keywords ? `关键词: ${keywords}` : ""}
${(content.content as string) ? `现有内容摘要: ${(content.content as string).substring(0, 500)}` : ""}

生成10条结构化大纲，每条以"- "开头，覆盖：
1. 开篇概述和核心价值
2-3. 评估标准/选择维度
4-8. 具体方案/产品对比（每个方案：功能特点 + 差异化优势）
9. 对比总结
10. 常见问题

直接返回Markdown格式的编号列表，不要其他文字。`;

  const outlineText = await chat([
    { role: "system", content: "你是B2B内容策略专家，擅长生成结构化内容大纲。直接返回大纲列表。" },
    { role: "user", content: prompt },
  ]);

  const outlineItems = outlineText.split("\n").filter(line => line.trim().match(/^[\d]+[\.\)、]\s*/) || line.trim().startsWith("- "));
  const outline = outlineItems.map((item, i) => ({ id: i + 1, text: item.replace(/^[\d]+[\.\)、]\s*/, "").replace(/^-\s*/, "").trim() }));

  if (outline.length === 0) {
    outlineText.split("\n").filter(l => l.trim()).forEach((line, i) => {
      outline.push({ id: i + 1, text: line.replace(/^[\d]+[\.\)、]\s*/, "").replace(/^-\s*/, "").trim() });
    });
  }

  await db.from("contents").update({ outline, updated_at: new Date().toISOString() }).eq("id", id);
  return NextResponse.json({ data: { outline } });
}

async function handleGenerateContent(id: string, user: { team_id?: string; id: string; name: string }, body: { language?: string; content_type?: string }) {
  const db = getSupabase();
  const { data: content } = await db.from("contents").select("*").eq("id", id).eq("team_id", user.team_id).single();
  if (!content) return NextResponse.json({ error: "内容不存在" }, { status: 404 });

  const outline = (content.outline as Array<{ id: number; text: string }>) || [];
  const outlineText = outline.map(o => `${o.id}. ${o.text}`).join("\n");
  const existingContent = (content.content as string) || "";

  const prompt = `你是一个B2B营销内容创作专家。请根据以下大纲生成一篇完整的内容。

标题: ${content.title}
类型: ${body.content_type || "BuyingGuide"}
语言: ${body.language || "zh-CN"}

大纲:
${outlineText || "根据标题自由发挥"}

${existingContent ? `现有内容可供参考:\n${existingContent.substring(0, 1000)}` : ""}

要求：
1. 引人注目的标题和TL;DR要点摘要
2. 清晰的结构，每个大纲点对应一个 ## 章节
3. 包含具体的案例、数据或操作建议
4. 包含一个对比表格（如有多个方案/产品）
5. 包含 FAQ 章节（至少3个问答）
6. 结尾包含行动号召（CTA）
7. 末尾添加 <!-- META: 一句话SEO描述 -->

直接返回Markdown格式的完整文章，1500-2500字。`;

  const generated = await chat([
    { role: "system", content: "你是专业的B2B内容创作者，擅长撰写技术营销文章。直接返回Markdown格式内容。" },
    { role: "user", content: prompt },
  ]);

  await db.from("contents").update({
    content: generated,
    status: "review",
    updated_at: new Date().toISOString(),
  }).eq("id", id);

  logActivity({ team_id: user.team_id!, user_id: user.id, user_name: user.name, action: "ai_generate_content_full", target: id, details: (content.title as string) || "" });

  return NextResponse.json({ data: { content: generated } });
}
