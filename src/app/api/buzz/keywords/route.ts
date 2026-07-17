import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { chat } from "@/lib/llm";

// POST /api/buzz/keywords — AI 关键词生成
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = await request.json();
  const topic = body.topic || body.brand || "";

  if (!topic.trim()) {
    return NextResponse.json({ error: "请输入品牌或话题" }, { status: 400 });
  }

  try {
    const result = await chat([
      {
        role: "system",
        content: `你是一个专业的 SEO 和社交媒体策略专家。根据用户输入的品牌或话题，生成相关的关键词建议。

返回格式（JSON）：
{
  "brand_keywords": ["关键词1", "关键词2", "关键词3"],
  "competitor_keywords": ["竞品词1", "竞品词2"],
  "trending_keywords": ["热门词1", "热门词2", "热门词3"],
  "longtail_keywords": ["长尾词1", "长尾词2"],
  "summary": "总体建议摘要，50字以内"
}`,
      },
      {
        role: "user",
        content: `请为以下品牌/话题生成关键词建议：${topic}`,
      },
    ]);

    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "AI 结果解析失败" }, { status: 500 });
    }

    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI 服务不可用";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
