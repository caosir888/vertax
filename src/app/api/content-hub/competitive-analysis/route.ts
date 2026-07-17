import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { chat } from "@/lib/llm";

// POST /api/content-hub/competitive-analysis — AI 竞品内容分析
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = await request.json();
  const { competitor_content, competitor_url, my_content, my_topic } = body;

  if (!competitor_content && !competitor_url) {
    return NextResponse.json({ error: "请提供竞品内容或URL" }, { status: 400 });
  }

  const source = competitor_content || `URL: ${competitor_url}`;
  const myText = my_content ? `\n我方内容：${my_content.substring(0, 2000)}` : "";
  const topic = my_topic ? `\n话题/关键词：${my_topic}` : "";

  const prompt = `你是一位内容策略和竞品分析专家。请分析以下竞品内容，并给出与我方内容的对比和改进建议。

竞品内容：${source.substring(0, 3000)}${myText}${topic}

请返回 JSON：
{
  "competitor_summary": "竞品内容一句话概括",
  "structure_analysis": {
    "has_h2": true/false,
    "has_h3": true/false,
    "has_intro": true/false,
    "has_conclusion": true/false,
    "estimated_word_count": 数字,
    "readability": "easy/medium/hard"
  },
  "seo_analysis": {
    "title_length": 数字,
    "estimated_keywords": ["关键词1", "关键词2"],
    "has_meta_description": true/false,
    "has_schema": true/false
  },
  "content_quality": {
    "expertise_signal": "low/medium/high",
    "data_usage": "low/medium/high",
    "actionability": "low/medium/high",
    "originality": "low/medium/high"
  },
  "strengths": ["竞品优势1", "优势2"],
  "weaknesses": ["竞品弱点1", "弱点2"],
  "our_gap_analysis": "与我方内容的差距分析和改进方向（50-100字）",
  "actionable_tips": ["可立即执行的改进建议1", "建议2", "建议3"]
}

要求：
- structure_analysis 基于实际内容结构判断
- 所有评分用 low/medium/high 三档
- actionable_tips 给出 3-5 条具体可操作的改进建议
- 如果无我方内容对比，our_gap_analysis 填通用优化建议`;

  try {
    const res = await chat([
      { role: "system", content: "你是内容策略和竞品分析专家。请严格返回 JSON，不要包含其他内容。" },
      { role: "user", content: prompt },
    ]);

    const cleaned = res.replace(/```json\n?|\n?```/g, "").trim();
    const analysis = JSON.parse(cleaned);

    return NextResponse.json({ data: analysis });
  } catch (e) {
    return NextResponse.json({ error: "AI 分析失败: " + (e instanceof Error ? e.message : "") }, { status: 500 });
  }
}
