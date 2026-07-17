import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/buzz/alerts — 告警规则列表
export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const monitorId = searchParams.get("monitor_id");

  let query = supabase
    .from("buzz_alerts")
    .select("*, buzz_monitors!inner(name)")
    .eq("team_id", user.team_id)
    .order("created_at", { ascending: false });

  if (monitorId) query = query.eq("monitor_id", monitorId);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/buzz/alerts — 创建告警规则
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const supabase = getSupabase();
  const body = await request.json();

  const { data, error } = await supabase
    .from("buzz_alerts")
    .insert({
      monitor_id: body.monitor_id,
      team_id: user.team_id,
      name: body.name,
      type: body.type,
      threshold: body.threshold || 0,
      enabled: body.enabled !== undefined ? body.enabled : true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
