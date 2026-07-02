import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 });
  }

  // 查数据库，找匹配的邮箱和密码
  const { data: user, error } = await getSupabase()
    .from("users")
    .select("id, name, email")
    .eq("email", email)
    .eq("password", password)
    .maybeSingle();

  if (error || !user) {
    return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
  }

  // 登录成功 → 设置 JWT cookie
  await setSessionCookie(user);

  return NextResponse.json({ data: user });
}
