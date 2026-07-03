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
  const plan = params.get("plan");
  const status = params.get("status");

  // 查询租户 + 成员计数
  let query = getSupabase()
    .from("tenants")
    .select("*");

  if (search) {
    query = query.or(`name.ilike.%${search}%,company_name.ilike.%${search}%`);
  }
  if (plan) query = query.eq("plan", plan);
  if (status) query = query.eq("subscription_status", status);

  const { data: tenants, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 补充每个租户的成员数
  const enriched = await Promise.all(
    (tenants || []).map(async (t) => {
      const { count: memberCount } = await getSupabase()
        .from("team_members")
        .select("*", { count: "exact", head: true })
        .eq("team_id", t.id);

      const { count: contentCount } = await getSupabase()
        .from("contents")
        .select("*", { count: "exact", head: true })
        .eq("team_id", t.id);

      const { count: leadCount } = await getSupabase()
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("team_id", t.id);

      return { ...t, member_count: memberCount || 0, content_count: contentCount || 0, lead_count: leadCount || 0 };
    })
  );

  return NextResponse.json({ data: enriched });
}
