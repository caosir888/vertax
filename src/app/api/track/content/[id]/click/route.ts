import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// GET /api/track/content/[id]/click?url=xxx — 公开点击追踪 + 重定向
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = request.nextUrl.searchParams.get("url") || "/";
  const supabase = getSupabase();

  try {
    const { data: existing } = await supabase
      .from("content_analytics")
      .select("id, clicks")
      .eq("content_id", id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("content_analytics")
        .update({ clicks: (existing.clicks || 0) + 1 })
        .eq("id", existing.id);
    } else {
      const { data: content } = await supabase
        .from("contents")
        .select("team_id")
        .eq("id", id)
        .maybeSingle();

      if (content) {
        await supabase.from("content_analytics").insert({
          content_id: id,
          team_id: content.team_id,
          clicks: 1,
        });
      }
    }
  } catch {
    // 静默失败，仍然重定向
  }

  return NextResponse.redirect(url);
}
