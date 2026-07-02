import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// PATCH /api/notifications/[id] — 标记为已读
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;

  const { data } = await getSupabase()
    .from("notifications")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ error: "通知不存在" }, { status: 404 });
  }

  const { error } = await getSupabase()
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
