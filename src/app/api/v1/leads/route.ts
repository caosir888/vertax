import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { validateApiKey, extractApiKey } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";

// GET /api/v1/leads — 获取线索列表
export async function GET(request: NextRequest) {
  const apiKey = extractApiKey(request);
  if (!apiKey) {
    return NextResponse.json({ error: "缺少 API Key" }, { status: 401 });
  }

  const auth = await validateApiKey(apiKey);
  if (!auth.valid || !auth.team_id) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const rl = rateLimit(`v1_leads_${auth.team_id}`, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "请求过于频繁" }, {
      status: 429,
      headers: { "X-RateLimit-Remaining": String(rl.remaining), "X-RateLimit-Reset": String(rl.reset) },
    });
  }

  const params = request.nextUrl.searchParams;
  const status = params.get("status");
  const search = params.get("search");
  const limit = Math.min(parseInt(params.get("limit") || "50"), 100);
  const offset = parseInt(params.get("offset") || "0");

  let query = getSupabase()
    .from("leads")
    .select("*")
    .eq("team_id", auth.team_id);

  if (status) query = query.eq("status", status);
  if (search) query = query.or(`name.ilike.%${search}%,company.ilike.%${search}%`);

  const { data, error } = await query
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, pagination: { limit, offset } });
}

// POST /api/v1/leads — 创建线索
export async function POST(request: NextRequest) {
  const apiKey = extractApiKey(request);
  if (!apiKey) {
    return NextResponse.json({ error: "缺少 API Key" }, { status: 401 });
  }

  const auth = await validateApiKey(apiKey);
  if (!auth.valid || !auth.team_id) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const rl = rateLimit(`v1_leads_create_${auth.team_id}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
  }

  const body = await request.json();
  const { name, company = "", email = "", phone = "", status = "new", source = "api", notes = "" } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "name 不能为空" }, { status: 400 });
  }

  // 获取团队中第一个用户作为创建者
  const { data: member } = await getSupabase()
    .from("team_members")
    .select("user_id")
    .eq("team_id", auth.team_id)
    .limit(1)
    .single();

  const { data, error } = await getSupabase()
    .from("leads")
    .insert({
      team_id: auth.team_id,
      user_id: member?.user_id,
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

  const { fireWebhookAsync } = await import("@/lib/webhook");
  fireWebhookAsync(auth.team_id, "lead.created", { id: data.id, name: data.name, company, email, status, source });

  return NextResponse.json({ data }, { status: 201 });
}
