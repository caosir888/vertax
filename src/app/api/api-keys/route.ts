import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { checkTeamPermission } from "@/lib/team-guard";

function generateApiKey(): string {
  return "vx_" + crypto.randomUUID().replace(/-/g, "");
}

// GET /api/api-keys — 获取团队的 API Keys
export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { data, error } = await getSupabase()
    .from("api_keys")
    .select("id, name, key, created_at, last_used_at")
    .eq("team_id", user.team_id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }

  // 脱敏：只显示 key 前 8 位
  const masked = (data || []).map((k: { key: string; [k: string]: unknown }) => ({
    ...k,
    key: k.key ? k.key.substring(0, 8) + "***" : "",
  }));

  return NextResponse.json({ data: masked });
}

// POST /api/api-keys — 创建新的 API Key
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
  const { name } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "名称不能为空" }, { status: 400 });
  }

  const apiKey = generateApiKey();

  const { data, error } = await getSupabase()
    .from("api_keys")
    .insert({ team_id: user.team_id, name: name.trim(), key: apiKey })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
