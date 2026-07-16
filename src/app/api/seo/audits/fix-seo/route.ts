import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { chat } from "@/lib/llm";
import { logActivity } from "@/lib/activity-logger";

// POST /api/seo/audits/fix-seo — AI 修复 SEO
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
  const currentTitle = (content.title as string) || (audit.meta_title as string) || "";
  const currentBody = (content.content as string) || "";
  const keyword = (audit.main_keyword as string) || ((content.tags as string[])?.[0]) || "";

  // AI 生成优化后的 meta_title, meta_description, 和内容改进建议
  const prompt = `你是一个SEO优化专家。请分析当前内容并生成优化后的Meta信息和改进后的开头段落。

当前标题: ${currentTitle}
当前关键词: ${keyword}
当前内容(前1200字):
${currentBody.substring(0, 1200)}

请返回JSON格式（只返回JSON，不要其他文字）：
{
  "meta_title": "优化后的Meta Title (30-60字符，包含关键词，吸引点击)",
  "meta_description": "优化后的Meta Description (120-160字符，包含关键词和CTA)",
  "improved_title": "优化后的H1标题",
  "improved_opening": "优化后的开头段落(200-300字)，包含关键词自然引入",
  "faq_section": "建议添加的FAQ问答段落(至少3组问答)",
  "conclusion_section": "建议添加的结论段(100-150字)，含CTA"
}`;

  try {
    const response = await chat([
      { role: "system", content: "你是SEO优化专家，擅长撰写优化的Meta信息和结构化内容。只返回JSON。" },
      { role: "user", content: prompt },
    ]);

    const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
    const fix = JSON.parse(cleaned);

    // 更新数据库
    await db.from("seo_audits")
      .update({
        meta_title: fix.meta_title,
        meta_description: fix.meta_description,
        meta_title_score: 20,
        meta_description_score: 20,
        keyword_score: 15,
        keyword_in_title: true,
        keyword_in_content: true,
        has_faq_section: true,
        has_conclusion: true,
        recommendations: [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", audit_id);

    // 也更新 contents 表
    const updates: Record<string, unknown> = {};
    if (fix.improved_title) updates.title = fix.improved_title;
    if (fix.improved_opening || fix.faq_section || fix.conclusion_section) {
      const parts: string[] = [];
      if (fix.improved_opening) parts.push(fix.improved_opening);
      if (currentBody.length > 200) parts.push("\n\n" + currentBody.substring(200, Math.min(currentBody.length, 2000)));
      if (fix.faq_section) parts.push("\n\n## 常见问题\n\n" + fix.faq_section);
      if (fix.conclusion_section) parts.push("\n\n## 总结\n\n" + fix.conclusion_section);
      updates.content = parts.join("\n");
    }

    if (Object.keys(updates).length > 0) {
      await db.from("contents").update(updates).eq("id", content.id);
    }

    logActivity({
      team_id: user.team_id!,
      user_id: user.id,
      user_name: user.name,
      action: "ai_fix_seo",
      target: audit_id,
      details: currentTitle,
    });

    return NextResponse.json({ data: { ...fix, content_id: content.id } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json({ error: "AI 修复失败: " + msg }, { status: 500 });
  }
}
