import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { sendNotification } from "@/lib/notifications";
import { fireWebhookAsync } from "@/lib/webhook";

// GET /api/opportunities — 获取商机列表
export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const stage = params.get("stage");
  const search = params.get("search");

  let query = getSupabase()
    .from("opportunities")
    .select("*")
    .eq("team_id", user.team_id);

  if (stage) query = query.eq("stage", stage);
  if (search) query = query.or(`name.ilike.%${search}%,company.ilike.%${search}%,contact_name.ilike.%${search}%`);

  const { data, error } = await query.order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/opportunities — 创建商机
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const {
    name,
    company = "",
    contact_name = "",
    lead_id = null,
    deal_value = 0,
    probability = 10,
    expected_close_date = null,
    products_interested = "",
    notes = "",
    stage = "initial_contact",
  } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "商机名称不能为空" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("opportunities")
    .insert({
      team_id: user.team_id,
      user_id: user.id,
      name: name.trim(),
      company,
      contact_name,
      lead_id,
      deal_value,
      probability,
      expected_close_date,
      products_interested,
      notes,
      stage,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logActivity({ team_id: user.team_id!, user_id: user.id, user_name: user.name, action: "创建商机", target: data.name });

  sendNotification({ team_id: user.team_id!, actor_id: user.id, title: `新商机「${data.name}」已创建`, message: `金额：¥${Number(data.deal_value).toLocaleString()}` });

  fireWebhookAsync(user.team_id!, "opportunity.created", { id: data.id, name: data.name, stage: data.stage, deal_value: data.deal_value });

  return NextResponse.json({ data }, { status: 201 });
}
