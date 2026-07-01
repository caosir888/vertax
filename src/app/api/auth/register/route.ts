import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, password, confirmPassword } = body;

  // 1. 验证必填
  if (!name || !email || !password) {
    return NextResponse.json({ error: "姓名、邮箱、密码不能为空" }, { status: 400 });
  }

  // 2. 验证两次密码一致
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "两次输入的密码不一致" }, { status: 400 });
  }

  // 3. 验证密码长度
  if (password.length < 8) {
    return NextResponse.json({ error: "密码至少需要8位" }, { status: 400 });
  }

  // 4. 检查邮箱是否已注册
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingUser) {
    return NextResponse.json({ error: "该邮箱已被注册" }, { status: 409 });
  }

  // 5. 写入数据库
  const { data, error } = await supabase
    .from("users")
    .insert({ name, email, password })
    .select("id, name, email, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 6. 注册成功 → 自动登录（设置 JWT cookie）
  await setSessionCookie({ id: data.id, name: data.name, email: data.email });

  return NextResponse.json({ data }, { status: 201 });
}
