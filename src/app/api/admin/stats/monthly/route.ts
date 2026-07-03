import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET() {
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

  const supabase = getSupabase();

  // 过去 12 个月的数据
  const labels: string[] = [];
  const data: number[] = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    labels.push(`${month}月`);

    const start = new Date(year, date.getMonth(), 1).toISOString();
    const end = new Date(year, month, 1).toISOString();

    const { count } = await supabase
      .from("tenants")
      .select("*", { count: "exact", head: true })
      .gte("created_at", start)
      .lt("created_at", end);

    data.push(count || 0);
  }

  return NextResponse.json({ data: { labels, data } });
}
