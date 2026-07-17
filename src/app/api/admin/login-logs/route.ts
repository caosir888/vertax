import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/admin/login-logs — 平台管理员查看所有登录记录
export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { data: adminUser } = await getSupabase()
    .from("users")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single();

  if (!adminUser?.is_platform_admin) {
    return NextResponse.json({ error: "无权限访问" }, { status: 403 });
  }

  const supabase = getSupabase();
  const url = request.nextUrl;
  const email = url.searchParams.get("email") || "";
  const userId = url.searchParams.get("user_id") || "";
  const success = url.searchParams.get("success"); // "true" or "false"
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 500);

  let query = supabase
    .from("login_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (email) query = query.ilike("email", `%${email}%`);
  if (userId) query = query.eq("user_id", userId);
  if (success === "true") query = query.eq("success", true);
  if (success === "false") query = query.eq("success", false);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, count });
}
