import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { chat } from "@/lib/llm";
import { logActivity } from "@/lib/activity-logger";

// PATCH /api/growth/briefs/[id] — 更新内容简报
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const db = getSupabase();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of ["title", "description", "content_type", "funnel_stage", "intent", "target_persona", "priority_question", "evidence_count", "primary_channel", "secondary_channel", "evidence_refs", "status", "generated_content", "sort_order"]) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  const { data, error } = await db
    .from("content_briefs")
    .update(updates)
    .eq("id", id)
    .eq("team_id", user.team_id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/growth/briefs/[id] — 操作分发
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const action = request.nextUrl.searchParams.get("action");
  const db = getSupabase();

  const { data: brief, error: briefError } = await db
    .from("content_briefs")
    .select("*, content_pillars(name, description, questions, priority_personas, topic_clusters(company_name, company_context))")
    .eq("id", id)
    .eq("team_id", user.team_id)
    .single();

  if (briefError || !brief) {
    return NextResponse.json({ error: "简报不存在" }, { status: 404 });
  }

  if (action === "generate") {
    // AI 生成完整内容
    const pillar = brief.content_pillars as Record<string, unknown> | null;
    const questions = ((pillar?.questions as Array<{ question: string }>) || []).map((q: { question: string }) => q.question).join("; ");

    const prompt = `你是一个B2B内容创作专家。请根据以下简报生成一篇完整的营销内容。

标题：${brief.title}
类型：${brief.content_type}
漏斗层级：${brief.funnel_stage}
目标角色：${brief.target_persona}
要回答的问题：${brief.priority_question || questions}
内容支柱：${pillar?.name || ""}
${brief.description ? `简述：${brief.description}` : ""}

请生成一篇结构完整、可直接发布的文章（800-1200字），包含：
1. 引人注目的标题和导语
2. 清晰的章节结构（使用 ## 标记小标题）
3. 具体的数据、案例或操作建议
4. 适合${brief.target_persona || "目标受众"}阅读的专业语气
5. 结尾包含行动号召（CTA）

直接返回Markdown格式的完整文章，不要添加额外说明。`;

    try {
      const content = await chat([
        { role: "system", content: "你是一个专业的B2B内容创作者，擅长撰写技术营销文章。直接返回Markdown格式内容。" },
        { role: "user", content: prompt },
      ]);

      await db
        .from("content_briefs")
        .update({ generated_content: content, status: "generated", updated_at: new Date().toISOString() })
        .eq("id", id);

      logActivity({
        team_id: user.team_id!,
        user_id: user.id,
        user_name: user.name,
        action: "ai_generate_content",
        target: id,
        details: brief.title,
      });

      return NextResponse.json({ data: { content } });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "未知错误";
      return NextResponse.json({ error: "AI 生成失败: " + msg }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "无效操作，支持 ?action=generate" }, { status: 400 });
}
