import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/documents — 获取团队文档列表
export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { data, error } = await getSupabase()
    .from("documents")
    .select("*")
    .eq("team_id", user.team_id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/documents — 上传文档
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

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

  // 文件类型校验
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
    "application/msword", // doc
    "text/plain",
    "text/markdown",
    "text/x-markdown",
  ];
  if (!allowedTypes.includes(file.type) && !file.name.endsWith(".md")) {
    return NextResponse.json({ error: "不支持的文件类型，请上传 PDF/Word/TXT/Markdown" }, { status: 400 });
  }

  // 文件大小限制 10MB
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "文件过大，最大支持 10MB" }, { status: 400 });
  }

  const supabase = getSupabase();
  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = `${user.team_id}/${Date.now()}_${file.name}`;

  // 上传到 Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: "上传失败: " + uploadError.message }, { status: 500 });
  }

  // 获取公开 URL
  const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath);

  // 写入数据库
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
    })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
