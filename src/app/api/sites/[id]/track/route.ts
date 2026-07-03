import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

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

// GET /api/sites/[id]/track — 获取站点统计数据
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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
