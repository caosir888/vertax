import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";

// GET /api/growth/schedules — 发布排期列表
export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const db = getSupabase();
  const url = request.nextUrl.searchParams;
  const status = url.get("status");
  const channel = url.get("channel");
  const month = url.get("month"); // YYYY-MM

  let query = db
    .from("publish_schedules")
    .select("*")
    .eq("team_id", user.team_id)
    .order("scheduled_date", { ascending: true });

  if (status) query = query.eq("status", status);
  if (channel) query = query.ilike("channel", `%${channel}%`);
  if (month) {
    query = query
      .gte("scheduled_date", `${month}-01`)
      .lt("scheduled_date", `${month}-31`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}

// POST /api/growth/schedules — 创建排期
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const db = getSupabase();

  const { data, error } = await db
    .from("publish_schedules")
    .insert({
      team_id: user.team_id,
      user_id: user.id,
      brief_id: body.brief_id || null,
      content_id: body.content_id || null,
      title: body.title,
      channel: body.channel || "",
      scheduled_date: body.scheduled_date || null,
      status: "planned",
      notes: body.notes || "",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logActivity({
    team_id: user.team_id!,
    user_id: user.id,
    user_name: user.name,
    action: "create_publish_schedule",
    target: data.id,
    details: body.title,
  });

  return NextResponse.json({ data }, { status: 201 });
}

// PATCH /api/growth/schedules — 更新排期
export async function PATCH(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const db = getSupabase();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of ["title", "channel", "scheduled_date", "status", "notes", "published_at"]) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  const { data, error } = await db
    .from("publish_schedules")
    .update(updates)
    .eq("id", body.id)
    .eq("team_id", user.team_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
