import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { setSessionCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { TRIAL_DAYS } from "@/lib/plans";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  // 限流：每 IP 每分钟最多 3 次注册
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const rl = rateLimit(`register:${ip}`, 3, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "注册请求过于频繁，请稍后再试" }, { status: 429 });
  }

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

  // 哈希密码
  const hashedPassword = await bcrypt.hash(password, 10);

  // 写入用户
  const { data: user, error } = await supabase
    .from("users")
    .insert({ name, email, password: hashedPassword })
    .select("id, name, email, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }

  // 自动创建默认团队（14 天试用期）
  const trialEnd = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: team, error: teamError } = await supabase
    .from("tenants")
    .insert({ name: name + "的团队", plan: "free", subscription_status: "trial", trial_ends_at: trialEnd })
    .select("id")
    .single();

  if (teamError) {
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }

  // 将用户加入团队（角色 = owner）
  const { error: memberError } = await supabase
    .from("team_members")
    .insert({ team_id: team.id, user_id: user.id, role: "owner" });

  if (memberError) {
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }

  // 注册成功 → 自动登录
  try {
    await setSessionCookie({ id: user.id, name: user.name, email: user.email, team_id: team.id });
  } catch {
    // cookie 设置失败不影响注册结果（用户可手动登录）
  }

  // 异步发送欢迎邮件（不影响响应速度）
  import("@/lib/email").then((m) => m.sendWelcomeEmail(email, name)).catch(() => {});

  // 异步通知平台管理员：有新用户注册
  (async () => {
    try {
      const { data: admins } = await supabase
        .from("users")
        .select("id")
        .eq("is_platform_admin", true);
      if (admins?.length) {
        await supabase.from("notifications").insert(
          admins.map((a) => ({
            team_id: team.id,
            user_id: a.id,
            title: "新用户注册",
            message: `${name} (${email}) 刚刚注册了智客`,
          }))
        );
      }
    } catch {}
  })();

  return NextResponse.json({ data: { ...user, team_id: team.id } }, { status: 201 });
}
