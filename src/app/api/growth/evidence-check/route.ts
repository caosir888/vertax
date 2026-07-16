import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { chat } from "@/lib/llm";

// POST /api/growth/evidence-check — AI 证据校验
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const { content, claim } = body;

  if (!content?.trim() && !claim?.trim()) {
    return NextResponse.json({ error: "请提供内容或主张" }, { status: 400 });
  }

  const prompt = `你是一个事实核查和证据校验专家。请检查以下内容中的关键主张是否有证据支撑。

${content ? `内容：\n${content.substring(0, 2000)}\n` : ""}
${claim ? `需要校验的主张：${claim}\n` : ""}

请以 JSON 格式返回分析结果（不要包含其他文字）：
{
  "claims": [
    {
      "statement": "文章中提出的主张",
      "has_evidence": true/false,
      "confidence": "高/中/低",
      "evidence_type": "数据引用/案例引用/逻辑推理/无证据",
      "suggestion": "改进建议（如缺乏证据则应如何补充）"
    }
  ],
  "overall_assessment": "整体评价（2-3句话）",
  "risk_level": "高/中/低"
}`;

  const response = await chat([
    { role: "system", content: "你是一个事实核查和证据校验专家。请严格按照 JSON 格式返回结果。" },
    { role: "user", content: prompt },
  ]);

  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
    return NextResponse.json({ data: JSON.parse(cleaned) });
  } catch {
    return NextResponse.json({ error: "分析失败，请重试" }, { status: 500 });
  }
}
