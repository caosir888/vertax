import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/buzz/overview — 声量引擎统计
export async function GET(_request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const supabase = getSupabase();
  const teamId = user.team_id;

  const [totalRes, pubRes, intRes, accRes] = await Promise.all([
    supabase.from("buzz_mentions").select("id", { count: "exact", head: true }).eq("team_id", teamId),
    supabase.from("buzz_mentions").select("id", { count: "exact", head: true }).eq("team_id", teamId).eq("status", "published"),
    supabase.from("buzz_mentions").select("interactions").eq("team_id", teamId),
    supabase.from("buzz_accounts").select("id", { count: "exact", head: true }).eq("team_id", teamId).eq("status", "active"),
  ]);

  const totalContent = totalRes.count || 0;
  const published = pubRes.count || 0;
  const totalInteractions = (intRes.data || []).reduce((sum: number, m: { interactions: number }) => sum + (m.interactions || 0), 0);
  const authorizedAccounts = accRes.count || 0;

  return NextResponse.json({
    data: {
      totalContent,
      published,
      totalInteractions,
      authorizedAccounts,
    },
  });
}
