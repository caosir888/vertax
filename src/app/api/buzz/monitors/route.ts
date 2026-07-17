import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/buzz/monitors — 监控器列表
export async function GET(_request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("buzz_monitors")
    .select("*")
    .eq("team_id", user.team_id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/buzz/monitors — 创建监控器
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const supabase = getSupabase();
  const body = await request.json();

  const { data, error } = await supabase
    .from("buzz_monitors")
    .insert({
      team_id: user.team_id,
      name: body.name,
      type: body.type,
      keywords: body.keywords || [],
      description: body.description || "",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
