import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { checkTeamPermission } from "@/lib/team-guard";

// GET /api/webhooks — 获取团队所有 webhooks
export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { data, error } = await getSupabase()
    .from("webhooks")
    .select("id, name, url, events, is_active, created_at")
    .eq("team_id", user.team_id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/webhooks — 创建 webhook
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const permit = await checkTeamPermission(user.id, user.team_id);
  if (!permit.allowed) {
    return NextResponse.json({ error: permit.error }, { status: 403 });
  }

  const body = await request.json();
  const { name, url, events } = body;

  if (!name?.trim() || !url?.trim()) {
    return NextResponse.json({ error: "名称和 URL 不能为空" }, { status: 400 });
  }

  if (!events?.length) {
    return NextResponse.json({ error: "请至少选择一个事件" }, { status: 400 });
  }

  const secret = "whsec_" + crypto.randomUUID().replace(/-/g, "");

  const { data, error } = await getSupabase()
    .from("webhooks")
    .insert({
      team_id: user.team_id,
      name: name.trim(),
      url: url.trim(),
      events,
      secret,
    })
    .select("id, name, url, events, is_active, secret, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
