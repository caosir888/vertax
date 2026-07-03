import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { sendNotification } from "@/lib/notifications";
import { fireWebhookAsync } from "@/lib/webhook";

// GET /api/leads — 获取线索列表（支持筛选和搜索）
export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const status = params.get("status");
  const search = params.get("search");
  const source = params.get("source");

  let query = getSupabase()
    .from("leads")
    .select("*")
    .eq("team_id", user.team_id);

  if (status) query = query.eq("status", status);
  if (source) query = query.eq("source", source);
  if (search) query = query.or(`name.ilike.%${search}%,company.ilike.%${search}%,email.ilike.%${search}%`);

  const { data, error } = await query.order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/leads — 新建线索
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const { name, company = "", email = "", phone = "", status = "new", source = "", notes = "" } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "姓名不能为空" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("leads")
    .insert({
      team_id: user.team_id,
      user_id: user.id,
      name: name.trim(),
      company,
      email,
      phone,
      status,
      source,
      notes,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logActivity({ team_id: user.team_id!, user_id: user.id, user_name: user.name, action: "创建线索", target: data.name });

  sendNotification({ team_id: user.team_id!, actor_id: user.id, title: `新线索「${data.name}」已创建`, message: `来源：${source || "手动录入"}` });

  fireWebhookAsync(user.team_id!, "lead.created", { id: data.id, name: data.name, company, email, status, source });

  return NextResponse.json({ data }, { status: 201 });
}
