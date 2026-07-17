import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/buzz/mentions — 内容列表
export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const monitorId = searchParams.get("monitor_id");
  const sentiment = searchParams.get("sentiment");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  let query = supabase
    .from("buzz_mentions")
    .select("*, buzz_monitors(name), buzz_accounts(platform, account_name, account_handle)")
    .eq("team_id", user.team_id)
    .order("created_at", { ascending: false });

  if (monitorId) query = query.eq("monitor_id", monitorId);
  if (sentiment) query = query.eq("sentiment", sentiment);
  if (status) query = query.eq("status", status);
  if (search) query = query.or(`title.ilike.%${search}%,snippet.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// POST /api/buzz/mentions — 创建内容
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const supabase = getSupabase();
  const body = await request.json();

  const { data, error } = await supabase
    .from("buzz_mentions")
    .insert({
      monitor_id: body.monitor_id,
      team_id: user.team_id,
      source: body.source || "",
      url: body.url || "",
      title: body.title,
      snippet: body.snippet || "",
      sentiment: body.sentiment || "",
      confidence: body.confidence || 0,
      status: body.status || "draft",
      platforms: body.platforms || [],
      account_id: body.account_id || null,
      mention_date: body.mention_date || new Date().toISOString().split("T")[0],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
