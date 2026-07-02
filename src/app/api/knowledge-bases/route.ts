import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/knowledge-bases — 获取团队的所有知识库
export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { data, error } = await getSupabase()
    .from("knowledge_bases")
    .select("*")
    .eq("team_id", user.team_id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/knowledge-bases — 创建新知识库
// Body: { name: "产品知识库", description?: "..." }
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description = "" } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "请输入知识库名称" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("knowledge_bases")
    .insert({
      team_id: user.team_id,
      name: name.trim(),
      description,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
