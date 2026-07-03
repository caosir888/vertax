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
  let is_platform_admin = false;
  if (user.team_id) {
    const { data } = await getSupabase()
      .from("team_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("team_id", user.team_id)
      .maybeSingle();
    if (data?.role) role = data.role;
  }

  // 查询平台管理员
  const { data: userData } = await getSupabase()
    .from("users")
    .select("is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (userData?.is_platform_admin) is_platform_admin = true;

  return NextResponse.json({ data: { ...user, role, is_platform_admin } });
}
