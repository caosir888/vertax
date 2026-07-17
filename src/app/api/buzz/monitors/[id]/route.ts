import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// PATCH /api/buzz/monitors/[id] — 更新监控器
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

  const { data, error } = await supabase
    .from("buzz_monitors")
    .update({
      name: body.name,
      type: body.type,
      keywords: body.keywords,
      description: body.description,
      status: body.status,
    })
    .eq("id", id)
    .eq("team_id", user.team_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// DELETE /api/buzz/monitors/[id] — 删除监控器
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
    .from("buzz_monitors")
    .delete()
    .eq("id", id)
    .eq("team_id", user.team_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { success: true } });
}
