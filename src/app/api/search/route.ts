import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/search?q=关键词 — 全局搜索（按 team_id 隔离）
export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q") || "";
  if (!q.trim()) {
    return NextResponse.json({ data: [] });
  }

  const keyword = `%${q.trim()}%`;

  // 搜索备忘录（当前团队）
  const { data: memos } = await getSupabase()
    .from("memos")
    .select("id, title")
    .eq("team_id", user.team_id)
    .ilike("title", keyword)
    .limit(5);

  const results = (memos || []).map((m: { id: string; title: string }) => ({
    id: m.id,
    title: m.title,
    type: "memo" as const,
    typeLabel: "备忘录",
    href: `/memos/${m.id}`,
  }));

  return NextResponse.json({ data: results });
}
