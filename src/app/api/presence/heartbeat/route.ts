import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { current_page = "" } = await request.json().catch(() => ({}));

  await getSupabase()
    .from("user_presence")
    .upsert(
      {
        user_id: user.id,
        team_id: user.team_id,
        user_name: user.name,
        current_page,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  return NextResponse.json({ data: "ok" });
}
