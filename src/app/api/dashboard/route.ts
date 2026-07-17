import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/dashboard — 统一数据看板
export async function GET(_request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const db = getSupabase();
  const teamId = user.team_id;

  const [
    { count: totalLeads },
    { data: leadsByStatus },
    { count: totalContent },
    { data: contentByStatus },
    { count: totalDocs },
    { count: totalSites },
    { count: totalPublishes },
    { data: recentLeads },
    { data: recentContent },
    // 新增：SEO 平均分
    { data: seoData },
    // 新增：内容互动统计
    { data: engagementData },
    // 新增：定时发布内容
    { count: scheduledCount },
    // 新增：GEO 版本数
    { count: geoCount },
    // 新增：已引用数
    { data: geoVersions },
  ] = await Promise.all([
    db.from("leads").select("*", { count: "exact", head: true }).eq("team_id", teamId),
    db.from("leads").select("status").eq("team_id", teamId),
    db.from("contents").select("*", { count: "exact", head: true }).eq("team_id", teamId),
    db.from("contents").select("status").eq("team_id", teamId),
    db.from("documents").select("*", { count: "exact", head: true }).eq("team_id", teamId),
    db.from("sites").select("*", { count: "exact", head: true }).eq("team_id", teamId),
    db.from("publish_records").select("*", { count: "exact", head: true }).eq("team_id", teamId),
    db.from("leads").select("id,name,company,status,created_at").eq("team_id", teamId).order("created_at", { ascending: false }).limit(5),
    db.from("contents").select("id,title,status,updated_at,scheduled_at").eq("team_id", teamId).order("updated_at", { ascending: false }).limit(5),
    db.from("seo_audits").select("overall_score").eq("team_id", teamId),
    db.from("content_analytics").select("views,clicks,likes,comments,shares").eq("team_id", teamId),
    db.from("contents").select("id", { count: "exact", head: true }).eq("team_id", teamId).eq("status", "scheduled").lte("scheduled_at", new Date(Date.now() + 7 * 86400000).toISOString()),
    db.from("geo_versions").select("*", { count: "exact", head: true }).eq("team_id", teamId),
    db.from("geo_versions").select("engine_tracking").eq("team_id", teamId).eq("status", "published"),
  ]);

  // 线索状态统计
  const leadStatusCount: Record<string, number> = { new: 0, contacted: 0, qualified: 0, proposal: 0, won: 0, lost: 0 };
  (leadsByStatus || []).forEach((l: { status: string }) => {
    if (leadStatusCount[l.status] !== undefined) leadStatusCount[l.status]++;
    else leadStatusCount[l.status] = 1;
  });

  // 内容状态统计
  const contentStatusCount: Record<string, number> = { draft: 0, review: 0, published: 0, scheduled: 0 };
  (contentByStatus || []).forEach((c: { status: string }) => {
    if (contentStatusCount[c.status] !== undefined) contentStatusCount[c.status]++;
    else contentStatusCount[c.status] = 1;
  });

  // SEO 平均分
  const seoScores = (seoData || []).map((s: { overall_score: number }) => s.overall_score).filter(Boolean);
  const avgSeoScore = seoScores.length > 0 ? Math.round(seoScores.reduce((a: number, b: number) => a + b, 0) / seoScores.length) : null;

  // 内容互动汇总
  const totalViews = (engagementData || []).reduce((s: number, a: { views: number }) => s + (a.views || 0), 0);
  const totalClicks = (engagementData || []).reduce((s: number, a: { clicks: number }) => s + (a.clicks || 0), 0);
  const totalEngagement = totalViews + totalClicks;

  // GEO 引用统计
  let totalCited = 0;
  (geoVersions || []).forEach((g: { engine_tracking: Array<{ status: string }> }) => {
    (g.engine_tracking || []).forEach((t) => { if (t.status === "cited") totalCited++; });
  });

  // 本月新增线索
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { count: monthLeads } = await db.from("leads").select("*", { count: "exact", head: true }).eq("team_id", teamId).gte("created_at", monthStart);

  // 最近 6 个月趋势
  const monthlyLabels: string[] = [];
  const monthlyLeadData: number[] = [];
  const monthlyContentData: number[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const from = d.toISOString();
    const to = new Date(now.getFullYear(), now.getMonth() - i + 1, 1).toISOString();
    monthlyLabels.push(`${d.getMonth() + 1}月`);

    const { count: lc } = await db.from("leads").select("*", { count: "exact", head: true }).eq("team_id", teamId).gte("created_at", from).lt("created_at", to);
    const { count: cc } = await db.from("contents").select("*", { count: "exact", head: true }).eq("team_id", teamId).gte("created_at", from).lt("created_at", to);
    monthlyLeadData.push(lc || 0);
    monthlyContentData.push(cc || 0);
  }

  // 即将发布的定时内容
  const { data: upcomingScheduled } = await db.from("contents")
    .select("id,title,scheduled_at").eq("team_id", teamId).eq("status", "scheduled")
    .gte("scheduled_at", now.toISOString()).order("scheduled_at").limit(5);

  // 平台管理员：最近注册
  let recentRegistrations: { id: string; name: string; email: string; created_at: string }[] = [];
  const { data: adminCheck } = await db.from("users").select("is_platform_admin").eq("id", user.id).single();
  if (adminCheck?.is_platform_admin) {
    const { data: regs } = await db.from("users").select("id, name, email, created_at").order("created_at", { ascending: false }).limit(5);
    recentRegistrations = (regs || []) as typeof recentRegistrations;
  }

  return NextResponse.json({
    data: {
      totalLeads: totalLeads || 0,
      totalContent: totalContent || 0,
      totalDocs: totalDocs || 0,
      totalSites: totalSites || 0,
      totalPublishes: totalPublishes || 0,
      monthLeads: monthLeads || 0,
      leadStatusCount,
      contentStatusCount,
      recentLeads: recentLeads || [],
      recentContent: recentContent || [],
      monthlyLabels,
      monthlyLeadData,
      monthlyContentData,
      recentRegistrations,
      // 新增
      avgSeoScore,
      totalViews,
      totalClicks,
      totalEngagement,
      geoCount: geoCount || 0,
      totalCited,
      scheduledCount: scheduledCount || 0,
      upcomingScheduled: upcomingScheduled || [],
    },
  });
}
