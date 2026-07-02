import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { chat } from "@/lib/llm";
import { templates, fillTemplate } from "@/lib/templates";

function parseVersions(text: string): { title?: string; content: string }[] {
  const versions: { title?: string; content: string }[] = [];
  const blocks = text.split(/---\s*版本\d+/).filter((b) => b.trim());

  for (const block of blocks) {
    const trimmed = block.trim();
    // 尝试提取【建议标题】【主题】等
    const titleMatch = trimmed.match(/【[^】]+】\s*(.+)/);
    const title = titleMatch ? titleMatch[0] : undefined;
    const content = title ? trimmed.replace(titleMatch![0], "").trim() : trimmed;
    versions.push({ title, content });
  }

  // 如果没匹配到版本分隔，返回原文本作为一个版本
  if (versions.length === 0 && text.trim()) {
    return [{ content: text.trim() }];
  }

  return versions;
}

// POST /api/content/generate — 根据模板生成文案
// Body: { template_id, variables: {...}, language }
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const { template_id, variables = {}, language = "zh-CN" } = body;

  const template = templates.find((t) => t.id === template_id);
  if (!template) {
    return NextResponse.json({ error: "未知模板" }, { status: 400 });
  }

  // 校验必填变量
  for (const v of template.variables) {
    if (!variables[v.key]?.trim() && v.key !== "tone") {
      return NextResponse.json({ error: `请填写：${v.label}` }, { status: 400 });
    }
  }

  const filledVars: Record<string, string> = {};
  for (const v of template.variables) {
    filledVars[v.key] = variables[v.key] || "";
  }
  filledVars.language = language;

  const userPrompt = fillTemplate(template.userPromptTemplate, filledVars);

  try {
    const result = await chat([
      { role: "system", content: template.systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    const versions = parseVersions(result);

    return NextResponse.json({
      data: {
        template_id,
        variables: filledVars,
        language,
        versions: versions.length > 0 ? versions : [{ content: result }],
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "生成失败" },
      { status: 500 }
    );
  }
}
