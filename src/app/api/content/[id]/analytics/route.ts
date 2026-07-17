import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/content/[id]/analytics — 获取单个内容的分析数据
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { id } = await params;

  const supabase = getSupabase();

  // 验证内容属于当前团队
  const { data: content } = await supabase
    .from("contents")
    .select("id, title, status, team_id")
    .eq("id", id)
    .eq("team_id", user.team_id)
    .maybeSingle();

  if (!content) return NextResponse.json({ error: "内容不存在" }, { status: 404 });

  // 获取分析数据
  const { data: analytics } = await supabase
    .from("content_analytics")
    .select("*")
    .eq("content_id", id)
    .maybeSingle();

  // 获取发布记录
  const { data: publishRecords } = await supabase
    .from("publish_records")
    .select("*")
    .eq("content_id", id)
    .order("published_at", { ascending: false });

  // 获取 SEO 评分
  const { data: seoAudit } = await supabase
    .from("seo_audits")
    .select("seo_score, aeo_score, overall_score, has_schema")
    .eq("content_id", id)
    .maybeSingle();

  // 获取 GEO 版本
  const { data: geoVersions } = await supabase
    .from("geo_versions")
    .select("id, engine_tracking, created_at")
    .eq("source_content_id", id)
    .order("created_at", { ascending: false })
    .limit(1);

  // 计算互动分
  const a = analytics || {};
  const engagement = (a.views || 0) + (a.likes || 0) * 2 + (a.comments || 0) * 5 + (a.shares || 0) * 3;

  // 追踪像素 URL
  const trackViewUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/track/content/${id}/view`;

  return NextResponse.json({
    data: {
      content_id: id,
      title: content.title,
      status: content.status,
      views: analytics?.views || 0,
      clicks: analytics?.clicks || 0,
      likes: analytics?.likes || 0,
      comments: analytics?.comments || 0,
      shares: analytics?.shares || 0,
      engagement,
      publish_records: publishRecords || [],
      seo: seoAudit ? { score: seoAudit.seo_score, aeo_score: seoAudit.aeo_score, overall_score: seoAudit.overall_score } : null,
      geo: geoVersions?.[0]?.engine_tracking || null,
      track_view_url: trackViewUrl,
    },
  });
}

// PATCH /api/content/[id]/analytics — 手动更新分析数据
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { views, clicks, likes, comments, shares } = body;

  const supabase = getSupabase();

  const { data: content } = await supabase
    .from("contents")
    .select("id, team_id")
    .eq("id", id)
    .eq("team_id", user.team_id)
    .maybeSingle();

  if (!content) return NextResponse.json({ error: "内容不存在" }, { status: 404 });

  const updates: Record<string, number> = {};
  if (typeof views === "number") updates.views = views;
  if (typeof clicks === "number") updates.clicks = clicks;
  if (typeof likes === "number") updates.likes = likes;
  if (typeof comments === "number") updates.comments = comments;
  if (typeof shares === "number") updates.shares = shares;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "请提供至少一个要更新的字段" }, { status: 400 });
  }

  const { data: result, error } = await supabase
    .from("content_analytics")
    .upsert({
      content_id: id,
      team_id: content.team_id,
      ...updates,
    }, { onConflict: "content_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: result });
}
