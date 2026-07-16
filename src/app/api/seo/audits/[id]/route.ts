import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/seo/audits/[id] — 单个审计详情
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { data, error } = await getSupabase()
    .from("seo_audits")
    .select("*, contents(title, content, status, tags, language)")
    .eq("id", id)
    .eq("team_id", user.team_id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "审计记录不存在" }, { status: 404 });
  }

  return NextResponse.json({ data });
}
