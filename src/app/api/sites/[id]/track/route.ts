import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// POST /api/sites/[id]/track — 公开访问，记录页面浏览
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let page = "home";
  try {
    const body = await request.json();
    page = body.page || "home";
  } catch {
    /* ignore parse errors */
  }

  // 异步记录，不阻塞响应
  getSupabase()
    .from("site_analytics")
    .insert({
      site_id: id,
      page,
      user_agent: request.headers.get("user-agent") || "",
      referer: request.headers.get("referer") || "",
    })
    .then(() => {});

  return NextResponse.json({ ok: true });
}

// GET /api/sites/[id]/track — 获取站点统计数据（需登录）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;

  // 验证站点属于当前用户团队
  const { data: siteCheck } = await getSupabase()
    .from("sites")
    .select("id")
    .eq("id", id)
    .eq("team_id", user.team_id)
    .maybeSingle();

  if (!siteCheck) {
    return NextResponse.json({ error: "站点不存在" }, { status: 404 });
  }

  const { data, error } = await getSupabase()
    .from("site_analytics")
    .select("page", { count: "exact" })
    .eq("site_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 按页面分组统计
  const pageCounts: Record<string, number> = {};
  for (const row of (data || []) as { page: string }[]) {
    const p = row.page || "home";
    pageCounts[p] = (pageCounts[p] || 0) + 1;
  }

  return NextResponse.json({
    total_views: (data || []).length,
    pages: pageCounts,
  });
}
