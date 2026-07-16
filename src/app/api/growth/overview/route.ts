import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/growth/overview — 增长系统统计
export async function GET(_request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const supabase = getSupabase();

  const [contentRes, publishedRes, draftRes] = await Promise.all([
    supabase.from("contents").select("id", { count: "exact", head: true }).eq("team_id", user.team_id),
    supabase.from("contents").select("id", { count: "exact", head: true }).eq("team_id", user.team_id).eq("status", "published"),
    supabase.from("contents").select("id", { count: "exact", head: true }).eq("team_id", user.team_id).eq("status", "draft"),
  ]);

  const total = contentRes.count || 0;
  const published = publishedRes.count || 0;
  const draft = draftRes.count || 0;
  const scheduled = 0; // 排期功能后续实现

  return NextResponse.json({
    data: {
      total,
      published,
      draft,
      scheduled,
      seoHealthScore: total > 0 ? 75 : 0, // 默认基准分，后续可基于真实审计计算
      geoVersions: 0,
    },
  });
}
