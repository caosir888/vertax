import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/team/members — 获取团队成员列表
export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  // 联表查询：team_members JOIN users
  const { data, error } = await getSupabase()
    .from("team_members")
    .select("id, team_id, user_id, role, created_at, users!inner(name, email)")
    .eq("team_id", user.team_id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 展平数据
  const members = (data || []).map((m: Record<string, unknown>) => ({
    id: m.id,
    team_id: m.team_id,
    user_id: m.user_id,
    role: m.role,
    user_name: (m.users as { name: string; email: string })?.name || "",
    user_email: (m.users as { name: string; email: string })?.email || "",
    created_at: m.created_at,
  }));

  return NextResponse.json({ data: members });
}
