import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { chat } from "@/lib/llm";
import { logActivity } from "@/lib/activity-logger";

// GET /api/growth/clusters — 主题集群列表
export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const db = getSupabase();
  const { data: clusters, error } = await db
    .from("topic_clusters")
    .select("*, content_pillars(*)")
    .eq("team_id", user.team_id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 查每个 pillar 的 briefs 数量
  const enriched = await Promise.all(
    (clusters || []).map(async (cluster) => {
      const pillars = await Promise.all(
        (cluster.content_pillars || []).map(async (p: { id: string }) => {
          const { data: briefs } = await db
            .from("content_briefs")
            .select("id,title,content_type,funnel_stage,status,target_persona,evidence_count")
            .eq("pillar_id", p.id)
            .order("sort_order", { ascending: true });
          const { data: evidence } = await db
            .from("evidence_items")
            .select("id,content,source")
            .eq("pillar_id", p.id);
          return { ...p, briefs: briefs || [], evidence: evidence || [] };
        })
      );
      return { ...cluster, pillars };
    })
  );

  return NextResponse.json({ data: enriched });
}

// POST /api/growth/clusters — AI 生成主题集群
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const { company_name, company_description, industry, target_markets } = body;

  if (!company_name?.trim()) {
    return NextResponse.json({ error: "请提供公司名称" }, { status: 400 });
  }

  const prompt = `你是一个B2B内容营销策略专家。请为以下公司生成完整的主题集群分析，用于规划 TOFU→MOFU→BOFU 全漏斗内容。

公司名称：${company_name}
${company_description ? `公司描述：${company_description}` : ""}
${industry ? `所属行业：${industry}` : ""}
${target_markets ? `目标市场：${target_markets}` : ""}

请以JSON格式返回分析结果（严格按此结构）：
{
  "company_context": "一段话描述公司核心能力、技术优势和差异化定位（150-200字）",
  "buyer_context": "一段话描述目标客户行业、买家角色和采购决策链（150-200字）",
  "problem_map": [
    {
      "funnel": "TOFU",
      "persona": "具体角色名称",
      "question": "该角色最关心的业务问题",
      "impact": "这个问题如何影响其供应商筛选与方案判断"
    }
  ],
  "distribution_channels": [
    {
      "name": "渠道名称（如：客户官网 · 解决方案页）",
      "type": "primary",
      "content_types": ["UseCasePage", "Comparison", "BuyingGuide"],
      "description": "一句话描述"
    }
  ],
  "pillars": [
    {
      "name": "内容支柱名称（2-4个）",
      "intent_type": "informational",
      "description": "此支柱的目的和范围",
      "questions": [
        {
          "funnel": "TOFU",
          "persona": "角色名",
          "question": "关键问题",
          "impact": "为什么重要"
        }
      ],
      "priority_personas": ["角色1", "角色2"],
      "primary_channels": ["客户官网 · 解决方案页"],
      "secondary_channels": ["外部媒体 / 第三方平台"],
      "evidence_required": 3,
      "briefs": [
        {
          "title": "内容标题",
          "description": "简述（50字内）",
          "content_type": "BuyingGuide",
          "funnel_stage": "TOFU",
          "intent": "informational",
          "target_persona": "目标角色",
          "priority_question": "优先回答的问题"
        }
      ]
    }
  ]
}

规则：
1. problem_map 需覆盖 TOFU/MOFU/BOFU 各1-2个关键问题，共4-6个
2. distribution_channels 包含3-5个渠道，分 primary（可系统发布）和 secondary（运营建议）
3. pillars 生成2-3个内容支柱，每个支柱3-4个内容简报
4. content_type 只能从以下选：BuyingGuide, CaseStudy, FAQ, Comparison, TechnicalDoc, UseCasePage, QnA, KnowledgeBase, Checklist, Whitepaper
5. funnel_stage 只能填 TOFU/MOFU/BOFU
6. intent 只能填 informational/commercial/transactional
7. 全部用中文，只返回JSON，不要任何解释文字`;

  try {
    const response = await chat([
      { role: "system", content: "你是一个B2B内容营销策略专家，擅长构建主题集群和内容规划。只返回JSON。" },
      { role: "user", content: prompt },
    ]);

    const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
    const aiResult = JSON.parse(cleaned);

    const db = getSupabase();

    // 1. 创建 topic_cluster
    const { data: cluster, error: clusterError } = await db
      .from("topic_clusters")
      .insert({
        team_id: user.team_id,
        user_id: user.id,
        name: `${company_name} — 主题集群`,
        company_name,
        company_context: aiResult.company_context || "",
        buyer_context: aiResult.buyer_context || "",
        problem_map: aiResult.problem_map || [],
        distribution_channels: aiResult.distribution_channels || [],
        status: "active",
      })
      .select("id")
      .single();

    if (clusterError) {
      return NextResponse.json({ error: "创建集群失败: " + clusterError.message }, { status: 500 });
    }

    // 2. 创建 pillars + briefs
    let totalBriefs = 0;
    for (let pi = 0; pi < (aiResult.pillars || []).length; pi++) {
      const p = aiResult.pillars[pi];
      const { data: pillar, error: pillarError } = await db
        .from("content_pillars")
        .insert({
          cluster_id: cluster.id,
          team_id: user.team_id,
          name: p.name,
          intent_type: p.intent_type || "informational",
          description: p.description || "",
          questions: p.questions || [],
          priority_personas: p.priority_personas || [],
          primary_channels: p.primary_channels || [],
          secondary_channels: p.secondary_channels || [],
          evidence_required: p.evidence_required || 3,
          sort_order: pi,
          status: "active",
        })
        .select("id")
        .single();

      if (pillarError) continue;

      // 创建 briefs
      for (let bi = 0; bi < (p.briefs || []).length; bi++) {
        const b = p.briefs[bi];
        await db.from("content_briefs").insert({
          pillar_id: pillar.id,
          team_id: user.team_id,
          title: b.title,
          description: b.description || "",
          content_type: b.content_type || "",
          funnel_stage: b.funnel_stage || "TOFU",
          intent: b.intent || "informational",
          target_persona: b.target_persona || "",
          priority_question: b.priority_question || "",
          evidence_count: 0,
          primary_channel: b.primary_channel || p.primary_channels?.[0] || "",
          secondary_channel: b.secondary_channel || p.secondary_channels?.[0] || "",
          sort_order: bi,
          status: "draft",
        });
        totalBriefs++;
      }
    }

    logActivity({
      team_id: user.team_id!,
      user_id: user.id,
      user_name: user.name,
      action: "ai_generate_topic_cluster",
      target: cluster.id,
      details: `${company_name} | ${aiResult.pillars?.length || 0}支柱 ${totalBriefs}简报`,
    });

    return NextResponse.json({ data: { id: cluster.id, pillars: aiResult.pillars?.length || 0, briefs: totalBriefs } }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json({ error: "AI 分析失败: " + msg }, { status: 500 });
  }
}
