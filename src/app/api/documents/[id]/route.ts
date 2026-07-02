import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// DELETE /api/documents/[id] — 删除文档
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;

  // 验证文档属于当前团队
  const { data: doc } = await getSupabase()
    .from("documents")
    .select("id, file_url")
    .eq("id", id)
    .eq("team_id", user.team_id)
    .maybeSingle();

  if (!doc) {
    return NextResponse.json({ error: "文档不存在" }, { status: 404 });
  }

  // 从 Storage 删除文件
  const url = doc.file_url;
  const pathMatch = url.match(/\/documents\/(.+)$/);
  if (pathMatch) {
    const filePath = decodeURIComponent(pathMatch[1]);
    await getSupabase().storage.from("documents").remove([filePath]);
  }

  // 从数据库删除记录
  const { error } = await getSupabase().from("documents").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
