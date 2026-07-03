import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { sendNotification } from "@/lib/notifications";

// GET /api/content/[id]/comments — 获取评论列表
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id: content_id } = await params;

  const { data, error } = await getSupabase()
    .from("content_comments")
    .select("*")
    .eq("content_id", content_id)
    .eq("team_id", user.team_id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/content/[id]/comments — 创建评论
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id: content_id } = await params;
  const { body } = await request.json();

  if (!body?.trim()) {
    return NextResponse.json({ error: "评论内容不能为空" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("content_comments")
    .insert({
      content_id,
      team_id: user.team_id,
      user_id: user.id,
      user_name: user.name,
      body: body.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logActivity({
    team_id: user.team_id!,
    user_id: user.id,
    user_name: user.name,
    action: "添加评论",
    target: content_id,
  });

  sendNotification({
    team_id: user.team_id!,
    actor_id: user.id,
    title: `${user.name} 添加了一条评论`,
    message: body.trim().slice(0, 100),
  });

  return NextResponse.json({ data }, { status: 201 });
}
