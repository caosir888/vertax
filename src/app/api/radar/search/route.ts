import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { runRadarSearch } from "@/lib/radar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const result = await runRadarSearch(
      user.team_id!,
      user.id,
      user.name || "系统"
    );
    return NextResponse.json({ data: result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "搜索失败" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { data: latest } = await getSupabase()
      .from("radar_search_jobs")
      .select("*")
      .eq("team_id", user.team_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ data: latest });
  } catch {
    const { data: lastLead } = await getSupabase()
      .from("leads")
      .select("created_at")
      .eq("team_id", user.team_id)
      .eq("source", "radar")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      data: lastLead
        ? { status: "completed", completed_at: lastLead.created_at }
        : null,
    });
  }
}
