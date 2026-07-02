import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, password, confirmPassword } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "姓名、邮箱、密码不能为空" }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "两次输入的密码不一致" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "密码至少需要8位" }, { status: 400 });
  }

  const supabase = getSupabase();

  // 检查邮箱是否已注册
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingUser) {
    return NextResponse.json({ error: "该邮箱已被注册" }, { status: 409 });
  }

  // 写入用户
  const { data: user, error } = await supabase
    .from("users")
    .insert({ name, email, password })
    .select("id, name, email, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 自动创建默认团队
  const { data: team, error: teamError } = await supabase
    .from("tenants")
    .insert({ name: name + "的团队" })
    .select("id")
    .single();

  if (teamError) {
    return NextResponse.json({ error: teamError.message }, { status: 500 });
  }

  // 将用户加入团队（角色 = owner）
  const { error: memberError } = await supabase
    .from("team_members")
    .insert({ team_id: team.id, user_id: user.id, role: "owner" });

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  // 注册成功 → 自动登录
  await setSessionCookie({ id: user.id, name: user.name, email: user.email, team_id: team.id });

  return NextResponse.json({ data: { ...user, team_id: team.id } }, { status: 201 });
}
