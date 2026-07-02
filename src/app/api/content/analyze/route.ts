import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { chat } from "@/lib/llm";
import { analyzeReadability, readabilityTips } from "@/lib/readability";

// POST /api/content/analyze — SEO 优化分析 + 可读性评分
// Body: { content: "文案内容", keywords?: "目标关键词", type?: "seo" | "social" | "email" }
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const { content, keywords = "", type = "seo" } = body;

  if (!content || !content.trim()) {
    return NextResponse.json({ error: "请输入需要分析的内容" }, { status: 400 });
  }

  try {
    // 1. 可读性分析（本地计算，不消耗 API）
    const readability = analyzeReadability(content);
    const tips = readabilityTips(readability);

    // 2. SEO 优化建议（LLM 分析）
    const systemPrompt = `你是一位资深的 SEO 和内容优化专家。请对用户提供的内容进行分析，给出具体的优化建议。
只分析内容质量和优化方向，不要重写全文。`;
    const userPrompt = `请分析以下${type === "email" ? "邮件" : type === "social" ? "社交媒体" : ""}文案，给出优化建议：

【目标关键词】${keywords || "未指定"}
【内容类型】${type}
【文案内容】
${content.trim()}

请从以下角度分析（简洁回答，每点 1-2 句话）：
1. 标题/开头吸引力：是否能抓住注意力？如何改进？
2. 结构逻辑：段落结构是否清晰？信息层级是否合理？
3. 关键词布局：关键词是否自然融入？有无堆砌或缺失？
4. 行动号召（CTA）：是否有明确的下一步指引？如何加强？
5. 整体改进建议：最重要的一条改进建议`;

    const analysis = await chat([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    return NextResponse.json({
      data: {
        readability: {
          score: readability.score,
          level: readability.level,
          stats: readability.stats,
          tips,
        },
        seo: { analysis },
        keywords,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "分析失败" },
      { status: 500 }
    );
  }
}
