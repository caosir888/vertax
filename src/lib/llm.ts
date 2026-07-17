// LLM 对话 — 调用 OpenAI 兼容 Chat Completions API
// 默认：OpenAI GPT-4o-mini
// 可配环境变量切换到其他兼容服务

const LLM_API_URL =
  process.env.LLM_API_URL || "https://api.openai.com/v1/chat/completions";
const LLM_API_KEY = process.env.LLM_API_KEY || "";
const LLM_MODEL = process.env.LLM_MODEL || "gpt-4o-mini";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatResponse {
  choices: { message: { content: string } }[];
}

export async function chat(messages: ChatMessage[]): Promise<string> {
  if (!LLM_API_KEY) {
    throw new Error("未配置 LLM_API_KEY 环境变量");
  }

  const res = await fetch(LLM_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages,
      temperature: 0.5,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LLM API 错误 (${res.status}): ${err}`);
  }

  const json: ChatResponse = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

export function buildRagPrompt(
  question: string,
  chunks: { content: string; document_name?: string; chunk_index?: number }[]
): ChatMessage[] {
  const context = chunks
    .map(
      (c, i) =>
        `[来源${i + 1}${c.document_name ? ` — ${c.document_name}` : ""}]\n${c.content}`
    )
    .join("\n\n");

  return [
    {
      role: "system",
      content: `你是智客(VertaX)的 AI 知识库助手。请根据以下知识库内容回答用户的问题。

规则：
1. 只根据提供的知识库内容回答，不要编造信息
2. 如果知识库中没有相关信息，请明确说"知识库中暂无相关信息"
3. 回答要简洁、专业，用中文
4. 引用来源时使用 [来源N] 标注`,
    },
    {
      role: "user",
      content: `知识库内容：\n\n${context}\n\n用户问题：${question}`,
    },
  ];
}
