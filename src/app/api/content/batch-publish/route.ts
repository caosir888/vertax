import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// POST /api/content/batch-publish — 批量发布
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { content_ids, platform = "manual", url = "", notes = "", scheduled_at = null } = await request.json();
  if (!Array.isArray(content_ids) || content_ids.length === 0) {
    return NextResponse.json({ error: "请选择至少一篇内容" }, { status: 400 });
  }

  if (content_ids.length > 20) {
    return NextResponse.json({ error: "一次最多发布 20 篇内容" }, { status: 400 });
  }

  const supabase = getSupabase();
  const now = new Date().toISOString();
  const results: { id: string; success: boolean; error?: string }[] = [];

  for (const id of content_ids) {
    if (scheduled_at) {
      // 定时发布
      const { error } = await supabase
        .from("contents")
        .update({ status: "scheduled", scheduled_at, updated_at: now })
        .eq("id", id)
        .eq("team_id", user.team_id);

      if (error) {
        results.push({ id, success: false, error: error.message });
      } else {
        await supabase.from("publish_records").insert({
          content_id: id, team_id: user.team_id, user_id: user.id,
          platform, url, notes, scheduled_at,
        });
        results.push({ id, success: true });
      }
    } else {
      // 立即发布
      const { error: uErr } = await supabase
        .from("contents")
        .update({ status: "published", updated_at: now })
        .eq("id", id)
        .eq("team_id", user.team_id);

      if (uErr) {
        results.push({ id, success: false, error: uErr.message });
      } else {
        await supabase.from("publish_records").insert({
          content_id: id, team_id: user.team_id, user_id: user.id,
          platform, url, notes, published_at: now,
        });
        results.push({ id, success: true });
      }
    }
  }

  return NextResponse.json({ data: { results, total: content_ids.length, success: results.filter((r) => r.success).length } });
}
