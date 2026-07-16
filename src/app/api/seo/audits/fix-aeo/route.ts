import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { chat } from "@/lib/llm";
import { logActivity } from "@/lib/activity-logger";

// POST /api/seo/audits/fix-aeo — AI 优化 GEO/AEO
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const req = await request.json();
  const { audit_id } = req;
  if (!audit_id) {
    return NextResponse.json({ error: "请提供审计ID" }, { status: 400 });
  }

  const db = getSupabase();

  const { data: audit, error: fetchError } = await db
    .from("seo_audits")
    .select("*, contents!inner(id, title, content, tags)")
    .eq("id", audit_id)
    .eq("team_id", user.team_id)
    .single();

  if (fetchError || !audit) {
    return NextResponse.json({ error: "审计记录不存在" }, { status: 404 });
  }

  const content = audit.contents as Record<string, unknown>;
  const title = (content.title as string) || "";
  const contentBody = (content.content as string) || "";
  const keyword = (audit.main_keyword as string) || "";

  const prompt = `你是一个AEO（Answer Engine Optimization）和GEO（Generative Engine Optimization）专家。请为以下内容生成优化。

标题: ${title}
关键词: ${keyword}
内容(前1500字):
${contentBody.substring(0, 1500)}

请返回JSON格式（只返回JSON）：
{
  "faq_schema": {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "问题1", "acceptedAnswer": { "@type": "Answer", "text": "回答1" } },
      { "@type": "Question", "name": "问题2", "acceptedAnswer": { "@type": "Answer", "text": "回答2" } },
      { "@type": "Question", "name": "问题3", "acceptedAnswer": { "@type": "Answer", "text": "回答3" } }
    ]
  },
  "geo_summary": "适合AI引擎引用的200字结构化摘要，包含关键信息和数据",
  "structured_content": "将原文改写成适合AI引擎理解的结构化版本（含标题层级、列表、定义），保持原意"
}`;

  try {
    const response = await chat([
      { role: "system", content: "你是AEO/GEO优化专家，擅长FAQ Schema生成和AI引擎内容优化。只返回JSON。" },
      { role: "user", content: prompt },
    ]);

    const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
    const fix = JSON.parse(cleaned);

    // 更新 seo_audits 表
    await db.from("seo_audits")
      .update({
        has_schema: true,
        has_faq: true,
        has_geo: true,
        faq_score: 15,
        geo_score: 10,
        aeo_score: 25,
        aeo_details: {
          faq_schema: { status: "ok", impact: "" },
          geo_version: { status: "ok", impact: "" },
          faq_section: { status: "ok", suggestion: "" },
          conclusion: { status: "ok", suggestion: "" },
        },
        faq_schema_json: JSON.stringify(fix.faq_schema),
        geo_summary: fix.geo_summary || "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", audit_id);

    // 更新 contents 追加结构化内容
    let newContent = contentBody;
    if (fix.structured_content) {
      newContent = fix.structured_content as string;
    }
    await db.from("contents")
      .update({ content: newContent, updated_at: new Date().toISOString() })
      .eq("id", content.id);

    logActivity({
      team_id: user.team_id!,
      user_id: user.id,
      user_name: user.name,
      action: "ai_fix_aeo",
      target: audit_id,
      details: title,
    });

    return NextResponse.json({ data: { ...fix, content_id: content.id } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json({ error: "AI 优化失败: " + msg }, { status: 500 });
  }
}
