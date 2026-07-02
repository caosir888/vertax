import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/chats/[id] — 获取单个会话 + 消息列表
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;

  const { data: session, error } = await getSupabase()
    .from("chat_sessions")
    .select("*")
    .eq("id", id)
    .eq("team_id", user.team_id)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: "会话不存在" }, { status: 404 });
  }

  const { data: messages } = await getSupabase()
    .from("chat_messages")
    .select("*")
    .eq("session_id", id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ data: { ...session, messages: messages || [] } });
}

// DELETE /api/chats/[id] — 删除会话（级联删除消息）
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;

  const { error } = await getSupabase()
    .from("chat_sessions")
    .delete()
    .eq("id", id)
    .eq("team_id", user.team_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: "ok" });
}
