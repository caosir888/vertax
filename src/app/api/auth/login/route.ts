import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { setSessionCookie } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, email, password")
    .eq("email", email)
    .maybeSingle();

  if (error || !user) {
    return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
  }

  // 查用户所属团队
  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  const sessionUser = { ...user, team_id: membership?.team_id };

  await setSessionCookie(sessionUser);

  return NextResponse.json({ data: sessionUser });
}
