import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { sendNotification } from "@/lib/notifications";

// GET /api/notifications — 获取通知列表
export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { data, error } = await getSupabase()
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const unread = (data || []).filter((n: { is_read: boolean }) => !n.is_read).length;

  return NextResponse.json({ data, unread });
}

// POST /api/notifications — 向团队成员发送通知
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const { title, message = "" } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "通知标题不能为空" }, { status: 400 });
  }

  sendNotification({
    team_id: user.team_id!,
    actor_id: user.id,
    title: title.trim(),
    message,
  });

  return NextResponse.json({ success: true, message: "通知已发送" }, { status: 201 });
}
