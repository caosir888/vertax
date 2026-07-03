import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { getICP, generateLeadProfile, getLeadProfile } from "@/lib/customer-profiling";

// GET /api/leads/[id]/profile — 获取已有画像
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;

  // 验证线索属于当前团队
  const { data: lead } = await getSupabase()
    .from("leads")
    .select("id")
    .eq("id", id)
    .eq("team_id", user.team_id)
    .maybeSingle();

  if (!lead) {
    return NextResponse.json({ error: "线索不存在" }, { status: 404 });
  }

  const profile = await getLeadProfile(id);
  return NextResponse.json({ data: profile });
}

// POST /api/leads/[id]/profile — 生成新画像
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;

  // 查询线索详情
  const { data: lead, error } = await getSupabase()
    .from("leads")
    .select("*")
    .eq("id", id)
    .eq("team_id", user.team_id)
    .maybeSingle();

  if (error || !lead) {
    return NextResponse.json({ error: "线索不存在" }, { status: 404 });
  }

  const icp = await getICP(user.team_id!);
  const profile = await generateLeadProfile(lead, icp, user.id, user.name);

  return NextResponse.json({ data: profile });
}
