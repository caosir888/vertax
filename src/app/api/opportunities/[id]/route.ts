import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { fireWebhookAsync } from "@/lib/webhook";

// GET /api/opportunities/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;

  const { data, error } = await getSupabase()
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .eq("team_id", user.team_id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "商机不存在" }, { status: 404 });
  }

  return NextResponse.json({ data });
}

// PATCH /api/opportunities/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) updates.name = body.name;
  if (body.company !== undefined) updates.company = body.company;
  if (body.contact_name !== undefined) updates.contact_name = body.contact_name;
  if (body.stage !== undefined) updates.stage = body.stage;
  if (body.deal_value !== undefined) updates.deal_value = body.deal_value;
  if (body.probability !== undefined) updates.probability = body.probability;
  if (body.expected_close_date !== undefined) updates.expected_close_date = body.expected_close_date;
  if (body.products_interested !== undefined) updates.products_interested = body.products_interested;
  if (body.notes !== undefined) updates.notes = body.notes;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "没有要更新的字段" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await getSupabase()
    .from("opportunities")
    .update(updates)
    .eq("id", id)
    .eq("team_id", user.team_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logActivity({ team_id: user.team_id!, user_id: user.id, user_name: user.name, action: "更新商机", target: data.name || id });

  fireWebhookAsync(user.team_id!, "opportunity.updated", { id: data.id, name: data.name, stage: data.stage, deal_value: data.deal_value });

  return NextResponse.json({ data });
}

// DELETE /api/opportunities/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;

  const { error } = await getSupabase()
    .from("opportunities")
    .delete()
    .eq("id", id)
    .eq("team_id", user.team_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logActivity({ team_id: user.team_id!, user_id: user.id, user_name: user.name, action: "删除商机", target: id });

  return NextResponse.json({ data: "ok" });
}
