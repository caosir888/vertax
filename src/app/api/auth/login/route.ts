import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { setSessionCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

async function logLogin(params: {
  user_id?: string;
  email: string;
  team_id?: string;
  success: boolean;
  ip: string;
  ua: string;
  reason?: string;
}) {
  try {
    await getSupabase().from("login_logs").insert({
      user_id: params.user_id || null,
      email: params.email,
      team_id: params.team_id || null,
      success: params.success,
      ip_address: params.ip,
      user_agent: params.ua,
      error_reason: params.reason || "",
    });
  } catch {
    // 日志记录失败不影响登录流程
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const ua = request.headers.get("user-agent") || "";

  // 限流：每 IP 每分钟最多 5 次登录尝试
  const rl = rateLimit(`login:${ip}`, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "登录尝试过于频繁，请稍后再试" }, { status: 429 });
  }

  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, email, password, is_platform_admin")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
  if (!user) {
    await logLogin({ email, success: false, ip, ua, reason: "用户不存在" });
    return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    await logLogin({ user_id: user.id, email, success: false, ip, ua, reason: "密码错误" });
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

  // 记录成功登录
  await logLogin({
    user_id: user.id,
    email,
    team_id: membership?.team_id,
    success: true,
    ip,
    ua,
  });

  return NextResponse.json({ data: sessionUser });
}
