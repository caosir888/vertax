import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// PATCH /api/buzz/alerts/[id] — 更新告警规则
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const supabase = getSupabase();
  const { id } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.type !== undefined) updateData.type = body.type;
  if (body.threshold !== undefined) updateData.threshold = body.threshold;
  if (body.enabled !== undefined) updateData.enabled = body.enabled;

  const { data, error } = await supabase
    .from("buzz_alerts")
    .update(updateData)
    .eq("id", id)
    .eq("team_id", user.team_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// DELETE /api/buzz/alerts/[id] — 删除告警规则
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const supabase = getSupabase();
  const { id } = await params;

  const { error } = await supabase
    .from("buzz_alerts")
    .delete()
    .eq("id", id)
    .eq("team_id", user.team_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { success: true } });
}
