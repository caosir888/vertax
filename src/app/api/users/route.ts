import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// GET /api/users — 获取所有用户
export async function GET() {
  // 调试：检查环境变量
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({
      debug: "环境变量缺失",
      NEXT_PUBLIC_SUPABASE_URL: url ? "已配置" : "未配置",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: key ? "已配置" : "未配置",
    });
  }

  try {
    const { data, error } = await getSupabase()
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({
      debug: "异常",
      message: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}

// POST /api/users — 新增用户
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email } = body;

  if (!name || !email) {
    return NextResponse.json({ error: "name 和 email 不能为空" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("users")
    .insert({ name, email })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
