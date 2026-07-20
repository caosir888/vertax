import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/admin/activity-logs — 平台管理员查看所有操作日志
export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  if (!user.is_platform_admin) {
    return NextResponse.json({ error: "无权限访问" }, { status: 403 });
  }

  const supabase = getSupabase();
  const url = request.nextUrl;
  const teamId = url.searchParams.get("team_id") || "";
  const userId = url.searchParams.get("user_id") || "";
  const action = url.searchParams.get("action") || "";
  const search = url.searchParams.get("search") || "";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 500);

  let query = supabase
    .from("activity_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (teamId) query = query.eq("team_id", teamId);
  if (userId) query = query.eq("user_id", userId);
  if (action) query = query.eq("action", action);
  if (search) query = query.or(`user_name.ilike.%${search}%,details.ilike.%${search}%,target.ilike.%${search}%,action.ilike.%${search}%`);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, count });
}
