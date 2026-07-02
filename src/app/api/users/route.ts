import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/users — 获取团队内的用户列表
export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  // 通过 team_members 获取同团队的所有用户
  const { data: members, error } = await getSupabase()
    .from("team_members")
    .select("user_id, role, users(id, name, email, created_at)")
    .eq("team_id", user.team_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const users = (members || []).map((m: { user_id: string; role: string; users: unknown }) => m.users);
  return NextResponse.json({ data: users });
}

// POST /api/users 已移除 — 用户通过 /api/auth/register 创建
export async function POST() {
  return NextResponse.json({ error: "请使用 /api/auth/register 注册" }, { status: 405 });
}
