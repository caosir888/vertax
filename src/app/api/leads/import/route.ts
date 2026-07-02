import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";

// POST /api/leads/import — CSV 批量导入
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const { rows } = body as { rows: { name: string; company?: string; email?: string; phone?: string; source?: string; notes?: string }[] };

  if (!rows?.length) {
    return NextResponse.json({ error: "没有可导入的数据" }, { status: 400 });
  }

  const leads = rows
    .filter((r) => r.name?.trim())
    .map((r) => ({
      team_id: user.team_id,
      user_id: user.id,
      name: r.name.trim(),
      company: r.company || "",
      email: r.email || "",
      phone: r.phone || "",
      source: r.source || "",
      notes: r.notes || "",
      status: "new",
    }));

  if (leads.length === 0) {
    return NextResponse.json({ error: "没有有效的线索数据" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("leads")
    .insert(leads)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logActivity({ team_id: user.team_id!, user_id: user.id, user_name: user.name, action: "导入线索", target: `${data.length} 条` });

  return NextResponse.json({ data: { imported: data.length } });
}
