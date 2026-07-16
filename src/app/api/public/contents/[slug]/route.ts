import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// GET /api/public/contents/[slug] — 公开内容 API，无需登录
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = getSupabase();

  const { data, error } = await db.from("contents")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "内容不存在" }, { status: 404 });
  }

  return NextResponse.json({ data });
}
