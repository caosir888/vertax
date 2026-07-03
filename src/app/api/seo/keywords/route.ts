import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { researchKeywords } from "@/lib/seo";

// POST /api/seo/keywords — AI 关键词研究
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const { topic, industry, language } = body;

  if (!topic || !topic.trim()) {
    return NextResponse.json({ error: "请输入研究主题" }, { status: 400 });
  }

  const keywords = await researchKeywords(
    topic.trim(),
    industry?.trim() || "SaaS",
    language || "zh-CN"
  );

  return NextResponse.json({ data: keywords });
}
