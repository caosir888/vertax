import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// DELETE /api/api-keys/[id] — 删除 API Key
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;

  // 验证该 key 属于当前团队
  const { data: key } = await getSupabase()
    .from("api_keys")
    .select("id")
    .eq("id", id)
    .eq("team_id", user.team_id)
    .maybeSingle();

  if (!key) {
    return NextResponse.json({ error: "API Key 不存在" }, { status: 404 });
  }

  const { error } = await getSupabase().from("api_keys").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
