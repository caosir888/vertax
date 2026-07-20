import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/login-logs — 当前用户查看自己的登录记录
export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const url = request.nextUrl;
  const success = url.searchParams.get("success");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);

  let query = getSupabase()
    .from("login_logs")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (success === "true") query = query.eq("success", true);
  if (success === "false") query = query.eq("success", false);

  const { data, error, count } = await query;

  if (error) {
    // 表不存在时返回友好提示
    if (error.message?.includes("does not exist") || error.code === "42P01") {
      return NextResponse.json({ data: [], count: 0, hint: "login_logs 表尚未创建，请联系管理员执行数据库迁移" });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, count });
}
