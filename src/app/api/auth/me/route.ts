import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  // 查询用户角色
  let role = "viewer";
  if (user.team_id) {
    const { data } = await getSupabase()
      .from("team_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("team_id", user.team_id)
      .maybeSingle();
    if (data?.role) role = data.role;
  }

  return NextResponse.json({ data: { ...user, role } });
}
