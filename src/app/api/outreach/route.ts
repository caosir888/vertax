import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/outreach — 今日外联工作台数据聚合
export async function GET(_request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [leadsRes, tasksRes, oppsRes] = await Promise.all([
    // 待跟进线索：next_contact_date <= 今天
    getSupabase()
      .from("leads")
      .select("*")
      .eq("team_id", user.team_id)
      .not("next_contact_date", "is", null)
      .lte("next_contact_date", today)
      .in("status", ["new", "contacted", "qualified"])
      .order("next_contact_date", { ascending: true }),
    // 今日任务：未完成的任务
    getSupabase()
      .from("tasks")
      .select("*")
      .eq("team_id", user.team_id)
      .neq("status", "done")
      .order("updated_at", { ascending: false }),
    // 即将到期商机：expected_close_date 在 7 天内
    getSupabase()
      .from("opportunities")
      .select("*")
      .eq("team_id", user.team_id)
      .not("expected_close_date", "is", null)
      .gte("expected_close_date", today)
      .lte("expected_close_date", nextWeek)
      .in("stage", ["initial_contact", "needs_confirmation", "proposal_quote", "negotiation"])
      .order("expected_close_date", { ascending: true }),
  ]);

  return NextResponse.json({
    data: {
      leads_to_follow_up: leadsRes.data || [],
      tasks_due_today: tasksRes.data || [],
      opportunities_closing: oppsRes.data || [],
      today,
    },
  });
}
