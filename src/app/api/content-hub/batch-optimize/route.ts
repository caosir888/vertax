import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// POST /api/content-hub/batch-optimize — 批量优化
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { content_ids } = await request.json();
  if (!Array.isArray(content_ids) || content_ids.length === 0) {
    return NextResponse.json({ error: "请选择至少一篇内容" }, { status: 400 });
  }

  if (content_ids.length > 10) {
    return NextResponse.json({ error: "一次最多优化 10 篇内容" }, { status: 400 });
  }

  const results: { id: string; success: boolean; error?: string }[] = [];

  // 调用单篇优化 API（内部复用）
  const optimizeUrl = new URL("/api/content-hub/optimize", request.url);

  for (const id of content_ids) {
    try {
      const res = await fetch(optimizeUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: request.headers.get("cookie") || "" },
        body: JSON.stringify({ content_id: id }),
      });
      const json = await res.json();
      results.push({ id, success: !!json.data, error: json.error });
    } catch (e) {
      results.push({ id, success: false, error: e instanceof Error ? e.message : "未知错误" });
    }
  }

  return NextResponse.json({ data: { results, total: content_ids.length, success: results.filter((r) => r.success).length } });
}
