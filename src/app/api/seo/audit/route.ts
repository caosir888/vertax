import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { auditSEO } from "@/lib/seo";

// POST /api/seo/audit — SEO 综合审计
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const { content, title, description, keyword } = body;

  if (!title) {
    return NextResponse.json({ error: "请提供页面标题" }, { status: 400 });
  }

  const result = await auditSEO(
    content || "",
    title,
    description || "",
    keyword || title
  );

  return NextResponse.json({ data: result });
}
