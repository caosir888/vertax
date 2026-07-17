import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/buzz/accounts — 已授权账号列表
export async function GET(_request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("buzz_accounts")
    .select("*")
    .eq("team_id", user.team_id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// POST /api/buzz/accounts — 添加授权账号
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const supabase = getSupabase();
  const body = await request.json();

  const { data, error } = await supabase
    .from("buzz_accounts")
    .insert({
      team_id: user.team_id,
      platform: body.platform,
      account_name: body.account_name,
      account_handle: body.account_handle || "",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
