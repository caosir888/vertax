import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { chat } from "@/lib/llm";

const langNames: Record<string, string> = {
  en: "英语",
  es: "西班牙语",
  ja: "日语",
  ko: "韩语",
  fr: "法语",
  de: "德语",
  pt: "葡萄牙语",
  "zh-CN": "简体中文",
};

// POST /api/content/translate — 多语言翻译 + 本地化润色
// Body: { content: "文案", target_lang: "es", source_lang?: "zh-CN" }
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const { content, target_lang, source_lang = "zh-CN" } = body;

  if (!content || !content.trim()) {
    return NextResponse.json({ error: "请输入需要翻译的内容" }, { status: 400 });
  }

  if (!target_lang) {
    return NextResponse.json({ error: "请选择目标语言" }, { status: 400 });
  }

  const targetName = langNames[target_lang] || target_lang;
  const sourceName = langNames[source_lang] || source_lang;

  try {
    const systemPrompt = `你是一位专业的商务翻译和本地化专家。你的翻译不仅要准确，还要符合目标语言的文化习惯和表达方式。`;
    const userPrompt = `请将以下${sourceName}文案翻译成${targetName}。

要求：
1. 翻译准确，保留原文的意思和语气
2. 本地化润色：调整表达方式使其符合${targetName}母语者的习惯（不是逐字直译）
3. 保留原文的格式（分段、列表、emoj等）
4. 如果有不适合目标文化的表达，请在翻译后注明建议

【原文（${sourceName}）】
${content.trim()}

请按以下格式输出：
---
【翻译（${targetName}）】
<翻译内容>
---
【本地化说明】
<简要说明做了哪些本地化调整，1-2 句话>`;

    const result = await chat([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    // 解析翻译和说明
    const transMatch = result.match(/【翻译[^】]*】\s*([\s\S]*?)(?=---|【本地化说明】|$)/);
    const noteMatch = result.match(/【本地化说明】\s*([\s\S]*?)$/);

    const translation = transMatch?.[1]?.trim() || result;
    const note = noteMatch?.[1]?.trim() || "";

    return NextResponse.json({
      data: {
        target_lang,
        source_lang,
        translation,
        localization_note: note,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "翻译失败" },
      { status: 500 }
    );
  }
}
