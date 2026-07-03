import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 60 * 1000).toISOString();

  const { data, error } = await getSupabase()
    .from("user_presence")
    .select("*")
    .eq("team_id", user.team_id)
    .gt("last_seen_at", cutoff)
    .order("last_seen_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
