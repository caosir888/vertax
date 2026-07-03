import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { validateApiKey, extractApiKey } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";

// GET /api/v1/leads/[id] — 获取单条线索
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiKey = extractApiKey(request);
  if (!apiKey) {
    return NextResponse.json({ error: "缺少 API Key" }, { status: 401 });
  }

  const auth = await validateApiKey(apiKey);
  if (!auth.valid || !auth.team_id) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { id } = await params;

  const { data, error } = await getSupabase()
    .from("leads")
    .select("*")
    .eq("id", id)
    .eq("team_id", auth.team_id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "线索不存在" }, { status: 404 });
  }

  return NextResponse.json({ data });
}

// PATCH /api/v1/leads/[id] — 更新线索
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiKey = extractApiKey(request);
  if (!apiKey) {
    return NextResponse.json({ error: "缺少 API Key" }, { status: 401 });
  }

  const auth = await validateApiKey(apiKey);
  if (!auth.valid || !auth.team_id) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.company !== undefined) updates.company = body.company;
  if (body.email !== undefined) updates.email = body.email;
  if (body.phone !== undefined) updates.phone = body.phone;
  if (body.status !== undefined) updates.status = body.status;
  if (body.source !== undefined) updates.source = body.source;
  if (body.notes !== undefined) updates.notes = body.notes;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await getSupabase()
    .from("leads")
    .update(updates)
    .eq("id", id)
    .eq("team_id", auth.team_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { fireWebhookAsync } = await import("@/lib/webhook");
  fireWebhookAsync(auth.team_id, "lead.updated", { id: data.id, name: data.name, status: data.status });

  return NextResponse.json({ data });
}
