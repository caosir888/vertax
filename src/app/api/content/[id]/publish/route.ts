import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { sendNotification } from "@/lib/notifications";
import { fireWebhookAsync } from "@/lib/webhook";

// POST /api/content/[id]/publish — 记录一次发布
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { platform = "manual", url = "", notes = "" } = body;

  // 更新内容状态为已发布
  const { error: updateError } = await getSupabase()
    .from("contents")
    .update({ status: "published", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("team_id", user.team_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // 记录发布
  const { data, error } = await getSupabase()
    .from("publish_records")
    .insert({
      content_id: id,
      team_id: user.team_id,
      user_id: user.id,
      platform,
      url,
      notes,
      published_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logActivity({ team_id: user.team_id!, user_id: user.id, user_name: user.name, action: "发布内容", target: id, details: platform });

  sendNotification({ team_id: user.team_id!, actor_id: user.id, title: `一条内容已发布到 ${platform}`, message: notes || `${user.name} 发布了一条内容` });

  fireWebhookAsync(user.team_id!, "content.published", { content_id: id, platform, url, notes });

  return NextResponse.json({ data });
}
