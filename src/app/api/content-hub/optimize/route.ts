import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { chat } from "@/lib/llm";
import { extractMetaInfo, analyzeAEO } from "@/lib/seo";

// POST /api/content-hub/optimize — 一键三检：SEO 审计修复 + AEO 结构化 + GEO 引擎适配
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const supabase = getSupabase();
  const { content_id } = await request.json();
  if (!content_id) return NextResponse.json({ error: "缺少 content_id" }, { status: 400 });

  // 获取内容
  const { data: content, error: contentErr } = await supabase
    .from("contents")
    .select("*")
    .eq("id", content_id)
    .eq("team_id", user.team_id)
    .single();

  if (contentErr || !content) {
    return NextResponse.json({ error: "内容不存在" }, { status: 404 });
  }

  const body = content.content || "";
  const title = content.title || content.seo_title || "";
  const tags = content.tags || [];
  const results: { seo: unknown; aeo: unknown; geo: unknown } = { seo: null, aeo: null, geo: null };

  // ====== Step 1: SEO 审计 + 修复 ======
  try {
    const meta = extractMetaInfo(body, title, tags);
    const keyword = meta.main_keyword || title.split(/[\s|｜-]/)[0] || "";

    // AI SEO 修复：生成优化后的 Meta + 内容改进
    const seoPrompt = `你是一位 SEO 优化专家。请为以下内容生成 SEO 优化方案。

标题：${title}
关键词：${keyword}
正文前 1500 字：${body.substring(0, 1500)}

请返回 JSON：
{
  "meta_title": "优化后的 Meta Title（30-60 字符，含关键词，有吸引力）",
  "meta_description": "优化后的 Meta Description（120-160 字符，含关键词和 CTA）",
  "seo_score": <0-100 整数>,
  "improvements": ["改进点1", "改进点2", "改进点3"]
}`;

    const seoRes = await chat([
      { role: "system", content: "你是 SEO 优化专家。请严格返回 JSON，不要包含其他内容。" },
      { role: "user", content: seoPrompt },
    ]);
    const seoData = JSON.parse(seoRes.replace(/```json\n?|\n?```/g, "").trim());

    // 写入 seo_audits
    const seoScore = seoData.seo_score || meta.meta_title_score + meta.meta_description_score + meta.word_count_score + meta.keyword_score;
    const aeoBase = analyzeAEO(body, title);
    const aeoScore = aeoBase.score;
    const totalScore = Math.min(seoScore + aeoScore, 100);

    await supabase.from("seo_audits").upsert({
      content_id: content.id,
      team_id: user.team_id,
      seo_score: seoScore,
      aeo_score: aeoScore,
      overall_score: totalScore,
      meta_title: seoData.meta_title,
      meta_description: seoData.meta_description,
      main_keyword: keyword,
      keyword_in_title: title.toLowerCase().includes(keyword.toLowerCase()),
      keyword_in_content: body.toLowerCase().includes(keyword.toLowerCase()),
      meta_title_score: meta.meta_title_score,
      meta_description_score: meta.meta_description_score,
      word_count_score: meta.word_count_score,
      keyword_score: meta.keyword_score,
      faq_score: aeoBase.faq_section.found ? 5 : 0,
      geo_score: 0,
      word_count: body.length,
      has_faq_section: meta.has_faq_section,
      has_conclusion: meta.has_conclusion,
      has_schema: false,
      has_geo: false,
      issues: JSON.stringify([]),
      recommendations: JSON.stringify(seoData.improvements || []),
    }, { onConflict: "content_id" });

    // 更新 contents 的 SEO 字段
    await supabase.from("contents").update({
      seo_title: seoData.meta_title,
      seo_description: seoData.meta_description,
    }).eq("id", content.id);

    results.seo = { score: seoScore, title: seoData.meta_title, description: seoData.meta_description };
  } catch (e) {
    results.seo = { error: e instanceof Error ? e.message : "SEO 优化失败" };
  }

  // ====== Step 2: AEO 结构化 ======
  try {
    const aeoPrompt = `你是一位结构化数据专家。请为以下内容生成 AEO 优化方案。

标题：${content.seo_title || title}
正文前 2000 字：${body.substring(0, 2000)}

请返回 JSON：
{
  "faq_schema": [{"question": "常见问题", "answer": "简要回答"}],
  "faq_section": "格式化的 FAQ 段落（Markdown）",
  "conclusion_section": "结论与行动建议段落（Markdown）",
  "article_schema_description": "100-160 字的文章摘要，用于 Article Schema"
}

要求：
- faq_schema 生成 4-5 个 FAQPage 适用的问答对
- faq_section 可直接插入文章末尾
- conclusion_section 总结核心观点 + 可操作的下一步`;

    const aeoRes = await chat([
      { role: "system", content: "你是结构化数据和内容优化专家。请严格返回 JSON。" },
      { role: "user", content: aeoPrompt },
    ]);
    const aeoData = JSON.parse(aeoRes.replace(/```json\n?|\n?```/g, "").trim());

    // 构建 FAQPage Schema
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: (aeoData.faq_schema || []).map((faq: { question: string; answer: string }) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    };

    // 更新 seo_audits
    await supabase.from("seo_audits").upsert({
      content_id: content.id,
      team_id: user.team_id,
      has_schema: true,
      faq_schema_json: faqSchema,
      aeo_details: JSON.stringify({
        faq_count: (aeoData.faq_schema || []).length,
        has_faq_section: true,
        has_conclusion: true,
      }),
    }, { onConflict: "content_id" });

    // 更新 contents
    await supabase.from("contents").update({
      geo_data: {
        faq_schema: faqSchema,
        faq_section: aeoData.faq_section,
        conclusion_section: aeoData.conclusion_section,
        article_description: aeoData.article_schema_description,
      },
    }).eq("id", content.id);

    results.aeo = { schema_generated: true, faq_count: (aeoData.faq_schema || []).length };
  } catch (e) {
    results.aeo = { error: e instanceof Error ? e.message : "AEO 优化失败" };
  }

  // ====== Step 3: GEO 引擎适配 ======
  try {
    const geoPrompt = `你是一位 GEO (Generative Engine Optimization) 专家。请为以下内容生成 AI 引擎优化版本。

原标题：${content.seo_title || title}
原文前 1500 字：${body.substring(0, 1500)}

请返回 JSON：
{
  "geo_title": "针对 AI 引擎优化的标题（英文，40-60 字符）",
  "geo_summary": "120-180 字英文摘要，B2B 采购指南风格，适合 ChatGPT/Claude/Perplexity 等 AI 引擎引用",
  "framework": "内容框架（如 Problem-Solution-Proof 或 BAR: Background-Action-Result）"
}`;

    const geoRes = await chat([
      { role: "system", content: "你是 GEO 优化专家。请严格返回 JSON。" },
      { role: "user", content: geoPrompt },
    ]);
    const geoData = JSON.parse(geoRes.replace(/```json\n?|\n?```/g, "").trim());

    // 创建 GEO 版本
    const { data: geoVersion } = await supabase.from("geo_versions").insert({
      team_id: user.team_id,
      user_id: user.id,
      source_content_id: content.id,
      title: geoData.geo_title,
      content: geoData.geo_summary,
      geo_summary: geoData.geo_summary,
      geo_title: geoData.geo_title,
      framework: geoData.framework,
      language: "en",
      region: "global",
      status: "draft",
      engine_tracking: [
        { engine: "ChatGPT", status: "pending" },
        { engine: "Claude", status: "pending" },
        { engine: "Perplexity", status: "pending" },
        { engine: "Gemini", status: "pending" },
        { engine: "Bing", status: "pending" },
      ],
      word_count: geoData.geo_summary.length,
    }).select().single();

    results.geo = {
      id: geoVersion?.id,
      title: geoData.geo_title,
      summary: geoData.geo_summary.substring(0, 100) + "...",
      framework: geoData.framework,
    };
  } catch (e) {
    results.geo = { error: e instanceof Error ? e.message : "GEO 适配失败" };
  }

  // ====== 生成 llms.txt 片段 ======
  let llmsTxt = "";
  try {
    llmsTxt = `# ${content.seo_title || title}\n## Summary\n${results.geo && typeof results.geo === "object" && "summary" in results.geo ? (results.geo as { summary: string }).summary : body.substring(0, 200)}...\n## Topics\n${tags.join(", ")}\n## Last Updated\n${new Date().toISOString().split("T")[0]}`;
  } catch { /* optional */ }

  return NextResponse.json({
    data: {
      seo: results.seo,
      aeo: results.aeo,
      geo: results.geo,
      llms_txt: llmsTxt,
    },
  });
}
