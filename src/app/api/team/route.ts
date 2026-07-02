import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { checkTeamPermission } from "@/lib/team-guard";

// GET /api/team — 获取当前团队信息
export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { data, error } = await getSupabase()
    .from("tenants")
    .select("*")
    .eq("id", user.team_id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// PATCH /api/team — 更新团队信息
export async function PATCH(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const permit = await checkTeamPermission(user.id, user.team_id);
  if (!permit.allowed) {
    return NextResponse.json({ error: permit.error }, { status: 403 });
  }

  const body = await request.json();
  const { name, company_name, industry, logo_url } = body;

  const updates: Record<string, string> = {};
  if (name) updates.name = name;
  if (company_name !== undefined) updates.company_name = company_name;
  if (industry !== undefined) updates.industry = industry;
  if (logo_url !== undefined) updates.logo_url = logo_url;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "没有需要更新的字段" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("tenants")
    .update(updates)
    .eq("id", user.team_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
