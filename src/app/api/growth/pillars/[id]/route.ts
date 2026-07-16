import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { chat } from "@/lib/llm";
import { logActivity } from "@/lib/activity-logger";

// PATCH /api/growth/pillars/[id] — 更新内容支柱
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
  for (const key of ["name", "intent_type", "description", "questions", "priority_personas", "primary_channels", "secondary_channels", "evidence_required", "sort_order", "status"]) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  const { data, error } = await db
    .from("content_pillars")
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

// POST /api/growth/pillars/[id] — 操作分发（?action=generate-briefs 或 ?action=generate-evidence）
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

  // 获取 pillar 信息
  const { data: pillar, error: pillarError } = await db
    .from("content_pillars")
    .select("*, topic_clusters(company_name, company_context, buyer_context)")
    .eq("id", id)
    .eq("team_id", user.team_id)
    .single();

  if (pillarError || !pillar) {
    return NextResponse.json({ error: "支柱不存在" }, { status: 404 });
  }

  if (action === "generate-briefs") {
    // AI 生成此支柱下的内容简报
    const questions = (pillar.questions || []).map((q: { question: string }) => q.question).join("; ");
    const personas = (pillar.priority_personas || []).join(", ");

    const prompt = `你是一个B2B内容策略专家。为以下内容支柱生成3-4个内容简报。

支柱名称：${pillar.name}
描述：${pillar.description || ""}
关键问题：${questions}
目标角色：${personas}
意图类型：${pillar.intent_type || "informational"}

请以JSON格式返回（只返回JSON）：
{
  "briefs": [
    {
      "title": "内容标题",
      "description": "简述（50字内）",
      "content_type": "BuyingGuide",
      "funnel_stage": "TOFU",
      "intent": "informational",
      "target_persona": "目标角色名",
      "priority_question": "此内容优先回答的问题"
    }
  ]
}

规则：
- content_type: BuyingGuide/CaseStudy/FAQ/Comparison/TechnicalDoc/UseCasePage/QnA/KnowledgeBase/Checklist/Whitepaper
- funnel_stage: TOFU/MOFU/BOFU，3-4个brief要分布在不同漏斗层级
- intent: informational/commercial/transactional
- 每个brief面向一个具体角色`;

    try {
      const response = await chat([
        { role: "system", content: "你是一个B2B内容策略专家。只返回JSON。" },
        { role: "user", content: prompt },
      ]);
      const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
      const result = JSON.parse(cleaned);

      let count = 0;
      for (let i = 0; i < (result.briefs || []).length; i++) {
        const b = result.briefs[i];
        await db.from("content_briefs").insert({
          pillar_id: id,
          team_id: user.team_id,
          title: b.title,
          description: b.description || "",
          content_type: b.content_type || "",
          funnel_stage: b.funnel_stage || "TOFU",
          intent: b.intent || "informational",
          target_persona: b.target_persona || "",
          priority_question: b.priority_question || "",
          evidence_count: 0,
          primary_channel: pillar.primary_channels?.[0] || "",
          secondary_channel: pillar.secondary_channels?.[0] || "",
          sort_order: i,
          status: "draft",
        });
        count++;
      }

      logActivity({
        team_id: user.team_id!,
        user_id: user.id,
        user_name: user.name,
        action: "ai_generate_briefs",
        target: id,
        details: `为支柱 ${pillar.name} 生成 ${count} 个简报`,
      });

      return NextResponse.json({ data: { generated: count } });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "未知错误";
      return NextResponse.json({ error: "AI 生成失败: " + msg }, { status: 500 });
    }
  }

  if (action === "generate-evidence") {
    // AI 生成证据库
    const clusterCtx = pillar.topic_clusters as Record<string, unknown> | null;
    const prompt = `你是一个事实核查和行业研究专家。为以下内容支柱生成${pillar.evidence_required || 3}条数据引用和事实证据。

公司：${clusterCtx?.company_name || ""}
支柱名称：${pillar.name}
描述：${pillar.description || ""}

请以JSON格式返回（只返回JSON）：
{
  "evidence": [
    {
      "content": "具体的数据引用或事实陈述（引用来源）",
      "source": "来源名称",
      "source_type": "行业报告/技术文档/案例数据/市场研究"
    }
  ]
}

每条证据需具体、可引用、与支柱主题直接相关。`;

    try {
      const response = await chat([
        { role: "system", content: "你是行业研究专家。只返回JSON。" },
        { role: "user", content: prompt },
      ]);
      const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
      const result = JSON.parse(cleaned);

      let count = 0;
      for (const e of result.evidence || []) {
        await db.from("evidence_items").insert({
          pillar_id: id,
          team_id: user.team_id,
          content: e.content,
          source: e.source || "",
          source_type: e.source_type || "",
        });
        count++;
      }

      // 更新 briefs 的 evidence_count
      await db
        .from("content_briefs")
        .update({ evidence_count: count })
        .eq("pillar_id", id);

      return NextResponse.json({ data: { generated: count } });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "未知错误";
      return NextResponse.json({ error: "AI 生成失败: " + msg }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "无效操作，支持 ?action=generate-briefs 或 ?action=generate-evidence" }, { status: 400 });
}
