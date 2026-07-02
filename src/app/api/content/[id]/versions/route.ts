import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/content/[id]/versions — 版本历史
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;

  const { data: versions, error } = await getSupabase()
    .from("content_versions")
    .select("*")
    .eq("content_id", id)
    .order("version_number", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: versions });
}

// POST /api/content/[id]/versions — 手动恢复某个版本
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;
  const { version_id } = await request.json();

  if (!version_id) {
    return NextResponse.json({ error: "请指定要恢复的版本" }, { status: 400 });
  }

  const { data: version } = await getSupabase()
    .from("content_versions")
    .select("*")
    .eq("id", version_id)
    .eq("content_id", id)
    .single();

  if (!version) {
    return NextResponse.json({ error: "版本不存在" }, { status: 404 });
  }

  const { data, error } = await getSupabase()
    .from("contents")
    .update({ content: version.content, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("team_id", user.team_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
