import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { extractText, chunkText } from "@/lib/text-extractor";

// POST /api/documents/[id]/parse — 解析文档文本并分块
export async function POST(
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
    .select("*")
    .eq("id", id)
    .eq("team_id", user.team_id)
    .maybeSingle();

  if (!doc) {
    return NextResponse.json({ error: "文档不存在" }, { status: 404 });
  }

  // 更新状态为 processing
  await getSupabase().from("documents").update({ status: "processing" }).eq("id", id);

  try {
    // 从 Supabase Storage 下载文件
    const url = doc.file_url;
    const pathMatch = url.match(/\/documents\/(.+?)(\?|$)/);
    if (!pathMatch) {
      await getSupabase().from("documents").update({ status: "error" }).eq("id", id);
      return NextResponse.json({ error: "无法解析文件路径" }, { status: 500 });
    }

    const filePath = decodeURIComponent(pathMatch[1]);
    const { data: fileData, error: downloadError } = await getSupabase()
      .storage
      .from("documents")
      .download(filePath);

    if (downloadError || !fileData) {
      await getSupabase().from("documents").update({ status: "error" }).eq("id", id);
      return NextResponse.json({ error: "下载文件失败: " + downloadError?.message }, { status: 500 });
    }

    // 提取文本
    const buffer = Buffer.from(await fileData.arrayBuffer());
    const text = await extractText(buffer, doc.file_type, doc.name);

    if (!text || !text.trim()) {
      await getSupabase().from("documents").update({ status: "error" }).eq("id", id);
      return NextResponse.json({ error: "未能从文档中提取到文本" }, { status: 500 });
    }

    // 分块
    const chunks = chunkText(text);
    if (chunks.length === 0) {
      await getSupabase().from("documents").update({ status: "error" }).eq("id", id);
      return NextResponse.json({ error: "文本分块结果为空" }, { status: 500 });
    }

    // 删除旧分块
    await getSupabase().from("document_chunks").delete().eq("document_id", id);

    // 插入新分块
    const { error: insertError } = await getSupabase()
      .from("document_chunks")
      .insert(
        chunks.map((content, i) => ({
          document_id: id,
          chunk_index: i,
          content,
        }))
      );

    if (insertError) {
      await getSupabase().from("documents").update({ status: "error" }).eq("id", id);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 更新状态为 done
    await getSupabase().from("documents").update({ status: "done" }).eq("id", id);

    return NextResponse.json({
      data: {
        text_length: text.length,
        chunk_count: chunks.length,
      },
    });
  } catch (err) {
    await getSupabase().from("documents").update({ status: "error" }).eq("id", id);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "解析失败" },
      { status: 500 }
    );
  }
}
