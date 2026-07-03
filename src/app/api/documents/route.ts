import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/documents — 获取团队文档列表
// Query: ?knowledge_base_id=xxx（可选，筛选某个知识库）
export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const kbId = request.nextUrl.searchParams.get("knowledge_base_id");

  let query = getSupabase()
    .from("documents")
    .select("*")
    .eq("team_id", user.team_id);

  if (kbId) {
    query = query.eq("knowledge_base_id", kbId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/documents — 上传文档（服务端接收）或记录元数据（客户端直传后）
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const supabase = getSupabase();
  const contentType = request.headers.get("content-type") || "";

  // 模式一：JSON 元数据（客户端已直传 Supabase Storage）
  if (contentType.includes("application/json")) {
    const body = await request.json();
    const { name, file_url, file_size, file_type, knowledge_base_id } = body;

    if (!name || !file_url) {
      return NextResponse.json({ error: "缺少文件名或文件地址" }, { status: 400 });
    }

    const { data, error: dbError } = await supabase
      .from("documents")
      .insert({
        team_id: user.team_id,
        user_id: user.id,
        name,
        file_url,
        file_size: file_size || 0,
        file_type: file_type || "",
        status: "ready",
        knowledge_base_id: knowledge_base_id || null,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  }

  // 模式二：FormData 服务端上传（小文件，向后兼容）
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "请上传文件" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "未找到文件" }, { status: 400 });
  }

  const knowledgeBaseId = (formData.get("knowledge_base_id") as string) || null;

  // 文件类型校验
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "text/plain",
    "text/markdown",
    "text/x-markdown",
  ];
  if (!allowedTypes.includes(file.type) && !file.name.endsWith(".md")) {
    return NextResponse.json({ error: "不支持的文件类型，请上传 PDF/Word/TXT/Markdown" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "文件过大，最大支持 10MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = `${user.team_id}/${Date.now()}_${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: "上传失败: " + uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath);

  const { data, error: dbError } = await supabase
    .from("documents")
    .insert({
      team_id: user.team_id,
      user_id: user.id,
      name: file.name,
      file_url: urlData.publicUrl,
      file_size: file.size,
      file_type: file.type || file.name.split(".").pop() || "",
      status: "ready",
      knowledge_base_id: knowledgeBaseId,
    })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
