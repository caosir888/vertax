import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { chat } from "@/lib/llm";
import { extractMetaInfo, analyzeAEO } from "@/lib/seo";

// POST /api/content-hub/optimize — 一键三检：SEO 审计修复 + AEO 结构化 + GEO 引擎适配
// 支持 stream=true 参数，开启 SSE 实时进度推送
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const supabase = getSupabase();
  const body = await request.json();
  const content_id = body.content_id;
  const useSSE = body.stream === true;

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

  const bodyText = content.content || "";
  const title = content.title || content.seo_title || "";
  const tags = content.tags || [];

  if (!useSSE) {
    // 传统 JSON 模式（向后兼容）
    const results = await runOptimizeSteps(supabase, content, bodyText, title, tags);
    return NextResponse.json({ data: results });
  }

  // SSE 流模式
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      send("start", { step: 0, total: 3, message: "开始智能优化..." });
      await sleep(300);

      // Step 1: SEO
      send("progress", { step: 1, total: 3, name: "seo", message: "正在进行 SEO 审计与修复..." });
      const seoResult = await runSEOStep(supabase, content, bodyText, title, tags);
      send("step_done", { step: 1, total: 3, name: "seo", result: seoResult });

      // Step 2: AEO
      send("progress", { step: 2, total: 3, name: "aeo", message: "正在进行 AEO 结构化..." });
      const aeoResult = await runAEOStep(supabase, content, bodyText, title);
      send("step_done", { step: 2, total: 3, name: "aeo", result: aeoResult });

      // Step 3: GEO
      send("progress", { step: 3, total: 3, name: "geo", message: "正在进行 GEO 引擎适配..." });
      const geoResult = await runGEOStep(supabase, content, { team_id: user.team_id!, id: user.id }, bodyText, title);

      const llmsTxt = buildLlmsTxt(content, title, tags, bodyText, geoResult);
      send("step_done", { step: 3, total: 3, name: "geo", result: geoResult, llms_txt: llmsTxt });

      send("complete", { message: "优化完成", seo: seoResult, aeo: aeoResult, geo: geoResult, llms_txt: llmsTxt });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

/* ========== 核心优化步骤 ========== */

async function runOptimizeSteps(
  supabase: ReturnType<typeof getSupabase>,
  content: Record<string, unknown>,
  bodyText: string,
  title: string,
  tags: string[],
) {
  const results: { seo: unknown; aeo: unknown; geo: unknown } = { seo: null, aeo: null, geo: null };
  const user = { team_id: content.team_id as string, id: content.created_by as string };

  results.seo = await runSEOStep(supabase, content, bodyText, title, tags);
  results.aeo = await runAEOStep(supabase, content, bodyText, title);
  results.geo = await runGEOStep(supabase, content, { team_id: user.team_id, id: user.id } as { team_id: string; id: string }, bodyText, title);

  const llmsTxt = buildLlmsTxt(content, title, tags, bodyText, results.geo);
  return { ...results, llms_txt: llmsTxt };
}

async function runSEOStep(
  supabase: ReturnType<typeof getSupabase>,
  content: Record<string, unknown>,
  bodyText: string,
  title: string,
  tags: string[],
) {
  try {
    const meta = extractMetaInfo(bodyText, title, tags);
    const keyword = meta.main_keyword || title.split(/[\s|｜-]/)[0] || "";

    const seoPrompt = `你是一位 SEO 优化专家。请为以下内容生成 SEO 优化方案。

标题：${title}
关键词：${keyword}
正文前 1500 字：${bodyText.substring(0, 1500)}

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

    const seoScore = seoData.seo_score || meta.meta_title_score + meta.meta_description_score + meta.word_count_score + meta.keyword_score;
    const aeoBase = analyzeAEO(bodyText, title);
    const aeoScore = aeoBase.score;
    const totalScore = Math.min(seoScore + aeoScore, 100);

    await supabase.from("seo_audits").upsert({
      content_id: content.id,
      team_id: content.team_id,
      seo_score: seoScore,
      aeo_score: aeoScore,
      overall_score: totalScore,
      meta_title: seoData.meta_title,
      meta_description: seoData.meta_description,
      main_keyword: keyword,
      keyword_in_title: title.toLowerCase().includes(keyword.toLowerCase()),
      keyword_in_content: bodyText.toLowerCase().includes(keyword.toLowerCase()),
      meta_title_score: meta.meta_title_score,
      meta_description_score: meta.meta_description_score,
      word_count_score: meta.word_count_score,
      keyword_score: meta.keyword_score,
      faq_score: aeoBase.faq_section.found ? 5 : 0,
      geo_score: 0,
      word_count: bodyText.length,
      has_faq_section: meta.has_faq_section,
      has_conclusion: meta.has_conclusion,
      has_schema: false,
      has_geo: false,
      issues: JSON.stringify([]),
      recommendations: JSON.stringify(seoData.improvements || []),
    }, { onConflict: "content_id" });

    await supabase.from("contents").update({
      seo_title: seoData.meta_title,
      seo_description: seoData.meta_description,
    }).eq("id", content.id);

    return { score: seoScore, title: seoData.meta_title, description: seoData.meta_description };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "SEO 优化失败" };
  }
}

async function runAEOStep(
  supabase: ReturnType<typeof getSupabase>,
  content: Record<string, unknown>,
  bodyText: string,
  title: string,
) {
  try {
    const aeoPrompt = `你是一位结构化数据专家。请为以下内容生成 AEO 优化方案。

标题：${content.seo_title || title}
正文前 2000 字：${bodyText.substring(0, 2000)}

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

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: (aeoData.faq_schema || []).map((faq: { question: string; answer: string }) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    };

    await supabase.from("seo_audits").upsert({
      content_id: content.id,
      team_id: content.team_id,
      has_schema: true,
      faq_schema_json: faqSchema,
      aeo_details: JSON.stringify({
        faq_count: (aeoData.faq_schema || []).length,
        has_faq_section: true,
        has_conclusion: true,
      }),
    }, { onConflict: "content_id" });

    await supabase.from("contents").update({
      geo_data: {
        faq_schema: faqSchema,
        faq_section: aeoData.faq_section,
        conclusion_section: aeoData.conclusion_section,
        article_description: aeoData.article_schema_description,
      },
    }).eq("id", content.id);

    return { schema_generated: true, faq_count: (aeoData.faq_schema || []).length };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "AEO 优化失败" };
  }
}

async function runGEOStep(
  supabase: ReturnType<typeof getSupabase>,
  content: Record<string, unknown>,
  user: { team_id: string; id: string },
  bodyText: string,
  title: string,
) {
  try {
    const geoPrompt = `你是一位 GEO (Generative Engine Optimization) 专家。请为以下内容生成 AI 引擎优化版本。

原标题：${content.seo_title || title}
原文前 1500 字：${bodyText.substring(0, 1500)}

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

    return {
      id: geoVersion?.id,
      title: geoData.geo_title,
      summary: geoData.geo_summary.substring(0, 100) + "...",
      framework: geoData.framework,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "GEO 适配失败" };
  }
}

function buildLlmsTxt(
  content: Record<string, unknown>,
  title: string,
  tags: string[],
  bodyText: string,
  geoResult: unknown,
): string {
  try {
    return `# ${content.seo_title || title}\n## Summary\n${geoResult && typeof geoResult === "object" && "summary" in geoResult ? (geoResult as { summary: string }).summary : bodyText.substring(0, 200)}...\n## Topics\n${tags.join(", ")}\n## Last Updated\n${new Date().toISOString().split("T")[0]}`;
  } catch {
    return "";
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
