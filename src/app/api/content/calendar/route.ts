import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/content/calendar — 获取内容日历数据
export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const url = request.nextUrl;
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "200"), 500);

  const { data, error } = await getSupabase()
    .from("contents")
    .select(`
      id, title, status, scheduled_at, updated_at,
      publish_records!inner(platform, url, published_at)
    `)
    .eq("team_id", user.team_id)
    .in("status", ["published", "scheduled"])
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = (data || []).map((c: Record<string, unknown>) => {
    const records = c.publish_records as Array<Record<string, unknown>> | null;
    const latest = records?.[0];
    return {
      id: c.id,
      title: c.title,
      status: c.status,
      scheduled_at: c.scheduled_at,
      updated_at: c.updated_at,
      published_at: latest?.published_at || c.updated_at,
      platform: latest?.platform || "",
      url: latest?.url || "",
    };
  });

  return NextResponse.json({ data: items });
}
