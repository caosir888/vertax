import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { data: adminUser } = await getSupabase()
    .from("users")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single();

  if (!adminUser?.is_platform_admin) {
    return NextResponse.json({ error: "无权限访问" }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const search = params.get("search");

  let query = getSupabase()
    .from("users")
    .select("id, name, email, is_disabled, is_platform_admin, created_at");

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data: users, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 补充每个用户的团队信息
  const enriched = await Promise.all(
    (users || []).map(async (u) => {
      const { data: memberships } = await getSupabase()
        .from("team_members")
        .select("team_id, role, tenants(name)")
        .eq("user_id", u.id);

      const teams = (memberships || []).map((m: Record<string, unknown>) => ({
        team_id: m.team_id,
        team_name: (m.tenants as { name: string })?.name || "未知",
        role: m.role,
      }));

      return { ...u, teams };
    })
  );

  return NextResponse.json({ data: enriched });
}
