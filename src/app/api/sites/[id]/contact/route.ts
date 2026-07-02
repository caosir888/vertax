import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/sites/[id]/contact — 获取询盘列表（需登录）
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;

  const { data, error } = await getSupabase()
    .from("site_inquiries")
    .select("*")
    .eq("site_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "42P01") {
      return NextResponse.json({ data: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/sites/[id]/contact — 独立站公开联系表单（无需登录）
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { name?: string; email?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const { name, email, message } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "姓名不能为空" }, { status: 400 });
  }
  if (!email || !email.trim()) {
    return NextResponse.json({ error: "邮箱不能为空" }, { status: 400 });
  }
  if (!message || !message.trim()) {
    return NextResponse.json({ error: "留言不能为空" }, { status: 400 });
  }

  // 简易邮箱格式校验
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
  }

  // 验证站点存在
  const { data: site, error: siteError } = await getSupabase()
    .from("sites")
    .select("id, team_id")
    .eq("id", id)
    .maybeSingle();

  if (siteError || !site) {
    return NextResponse.json({ error: "站点不存在" }, { status: 404 });
  }

  const { error: insertError } = await getSupabase()
    .from("site_inquiries")
    .insert({
      site_id: id,
      team_id: site.team_id,
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });

  if (insertError) {
    // 表不存在时给出明确提示
    if (insertError.code === "42P01") {
      return NextResponse.json(
        { error: "系统未就绪，请联系站点管理员" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "提交失败: " + insertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: "ok" });
}
