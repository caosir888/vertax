import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/dashboard — 仪表盘统计数据
export async function GET(_request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const db = getSupabase();
  const teamId = user.team_id;

  // 并行查询所有统计数据
  const [
    { count: totalLeads },
    { data: leadsByStatus },
    { count: totalContent },
    { data: contentByStatus },
    { count: totalDocs },
    { data: recentLeads },
    { data: recentContent },
  ] = await Promise.all([
    // 线索总数
    db.from("leads").select("*", { count: "exact", head: true }).eq("team_id", teamId),
    // 线索按状态分布
    db.from("leads").select("status").eq("team_id", teamId),
    // 内容总数
    db.from("contents").select("*", { count: "exact", head: true }).eq("team_id", teamId),
    // 内容按状态分布
    db.from("contents").select("status").eq("team_id", teamId),
    // 文档总数
    db.from("documents").select("*", { count: "exact", head: true }).eq("team_id", teamId),
    // 最近 5 条线索
    db.from("leads").select("id,name,company,status,created_at").eq("team_id", teamId).order("created_at", { ascending: false }).limit(5),
    // 最近 5 条内容
    db.from("contents").select("id,title,status,updated_at").eq("team_id", teamId).order("updated_at", { ascending: false }).limit(5),
  ]);

  // 统计各状态的线索数量
  const leadStatusCount: Record<string, number> = {
    new: 0, contacted: 0, qualified: 0, proposal: 0, won: 0, lost: 0,
  };
  (leadsByStatus || []).forEach((l: { status: string }) => {
    if (leadStatusCount[l.status] !== undefined) leadStatusCount[l.status]++;
    else leadStatusCount[l.status] = 1;
  });

  // 统计各状态的内容数量
  const contentStatusCount: Record<string, number> = { draft: 0, review: 0, published: 0 };
  (contentByStatus || []).forEach((c: { status: string }) => {
    if (contentStatusCount[c.status] !== undefined) contentStatusCount[c.status]++;
    else contentStatusCount[c.status] = 1;
  });

  // 本月新增线索数
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { count: monthLeads } = await db
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId)
    .gte("created_at", monthStart);

  return NextResponse.json({
    data: {
      totalLeads: totalLeads || 0,
      totalContent: totalContent || 0,
      totalDocs: totalDocs || 0,
      monthLeads: monthLeads || 0,
      leadStatusCount,
      contentStatusCount,
      recentLeads: recentLeads || [],
      recentContent: recentContent || [],
    },
  });
}
