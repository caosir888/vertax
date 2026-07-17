import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { chat } from "@/lib/llm";

// POST /api/buzz/mentions/analyze — AI 情感分析
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const supabase = getSupabase();
  const body = await request.json();
  const mentionIds: string[] = body.ids || [];

  if (mentionIds.length === 0) {
    return NextResponse.json({ error: "请选择要分析的提及" }, { status: 400 });
  }

  // 获取未标记情感的提及
  const { data: mentions, error: fetchError } = await supabase
    .from("buzz_mentions")
    .select("id, title, snippet")
    .eq("team_id", user.team_id)
    .in("id", mentionIds);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!mentions || mentions.length === 0) {
    return NextResponse.json({ error: "未找到相关提及" }, { status: 404 });
  }

  // 构建 AI 分析请求
  const mentionsText = mentions
    .map((m, i) => `[${i + 1}] 标题：${m.title}\n摘要：${m.snippet || "无"}`)
    .join("\n\n");

  try {
    const result = await chat([
      {
        role: "system",
        content: `你是一个专业的品牌舆情分析师。请分析以下提及数据，对每条做出情感判断（positive/negative/neutral），并给出置信度(0-1)。

返回格式（JSON）：
{
  "results": [
    { "index": 1, "sentiment": "positive", "confidence": 0.85 },
    { "index": 2, "sentiment": "negative", "confidence": 0.72 }
  ],
  "summary": "总体分析摘要，50字以内"
}`,
      },
      {
        role: "user",
        content: `请分析以下提及：\n\n${mentionsText}`,
      },
    ]);

    // 解析 AI 返回的 JSON
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "AI 分析结果解析失败" }, { status: 500 });
    }

    const analysis = JSON.parse(jsonMatch[0]);
    const results: { index: number; sentiment: string; confidence: number }[] = analysis.results || [];

    // 更新数据库
    for (const r of results) {
      const mention = mentions[r.index - 1];
      if (mention && r.sentiment) {
        await supabase
          .from("buzz_mentions")
          .update({
            sentiment: r.sentiment,
            confidence: r.confidence || 0,
          })
          .eq("id", mention.id);
      }
    }

    return NextResponse.json({
      data: {
        analyzed: results.length,
        summary: analysis.summary || "",
        results,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI 服务不可用";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
