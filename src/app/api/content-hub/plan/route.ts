import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { chat } from "@/lib/llm";

// POST /api/content-hub/plan — AI 生成用户问题库（按买家旅程阶段分组）
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { topic, audience, context } = await request.json();
  if (!topic) return NextResponse.json({ error: "请输入话题/主题" }, { status: 400 });

  const prompt = `你是一位 B2B 内容策略和用户研究专家。请为以下主题生成「用户问题库」。

主题：${topic}
${audience ? `目标客户：${audience}` : ""}
${context ? `补充背景：${context}` : ""}

请站在目标客户的角度思考：他们在购买决策的不同阶段会问什么问题？

按买家旅程三个阶段组织问题，返回 JSON：

{
  "awareness": [
    { "question": "问题内容", "intent": "用户想了解什么" }
  ],
  "consideration": [
    { "question": "问题内容", "intent": "用户想了解什么" }
  ],
  "decision": [
    { "question": "问题内容", "intent": "用户想了解什么" }
  ]
}

规则：
- awareness（认知阶段）：用户刚意识到问题/需求，在了解基本概念、行业趋势
- consideration（考虑阶段）：用户在比较方案，关注具体方法、工具、成本
- decision（决策阶段）：用户准备选择供应商，关注案例、ROI、实施细节
- 每个阶段 3-5 个问题
- 问题要真实、具体，像真正的客户会问的那样
- 用中文生成问题`;

  const response = await chat([
    { role: "system", content: "你是一位 B2B 用户研究专家。请严格按照 JSON 格式返回结果，不要包含其他文字。" },
    { role: "user", content: prompt },
  ]);

  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
    const data = JSON.parse(cleaned);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "AI 生成失败，请重试" }, { status: 500 });
  }
}
