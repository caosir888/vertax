import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// GET /api/cron/scheduled-publish — 自动发布到期内容（每 10 分钟执行一次）
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const now = new Date().toISOString();

  // 查找所有到期未发布的定时内容
  const { data: scheduled, error } = await supabase
    .from("contents")
    .select("id, team_id, title")
    .eq("status", "scheduled")
    .lte("scheduled_at", now)
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let published = 0;
  for (const item of scheduled || []) {
    const { error: updateErr } = await supabase
      .from("contents")
      .update({ status: "published", updated_at: now })
      .eq("id", item.id);

    if (!updateErr) {
      // 更新发布记录的时间
      await supabase
        .from("publish_records")
        .update({ published_at: now })
        .eq("content_id", item.id)
        .is("published_at", null);

      published++;
    }
  }

  return NextResponse.json({
    message: "Scheduled publish completed",
    total: (scheduled || []).length,
    published,
    checked_at: now,
  });
}
