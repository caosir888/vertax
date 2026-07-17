import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// 1x1 透明 GIF 的 base64
const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

// GET /api/track/content/[id]/view — 公开浏览追踪（可嵌入 <img> 标签）
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();

  try {
    // 查找 content_analytics 记录
    const { data: existing } = await supabase
      .from("content_analytics")
      .select("id, views")
      .eq("content_id", id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("content_analytics")
        .update({ views: (existing.views || 0) + 1 })
        .eq("id", existing.id);
    } else {
      // 根据 content_id 找到 team_id
      const { data: content } = await supabase
        .from("contents")
        .select("team_id")
        .eq("id", id)
        .maybeSingle();

      if (content) {
        await supabase.from("content_analytics").insert({
          content_id: id,
          team_id: content.team_id,
          views: 1,
        });
      }
    }
  } catch {
    // 静默失败，不影响像素返回
  }

  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
