import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { getEmbeddings } from "@/lib/embedding";

// POST /api/documents/[id]/embed — 向量化文档的所有分块
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
    .select("id, status")
    .eq("id", id)
    .eq("team_id", user.team_id)
    .maybeSingle();

  if (!doc) {
    return NextResponse.json({ error: "文档不存在" }, { status: 404 });
  }

  // 获取所有未向量化的分块
  const { data: chunks } = await getSupabase()
    .from("document_chunks")
    .select("id, content, chunk_index")
    .eq("document_id", id)
    .is("embedding", null)
    .order("chunk_index", { ascending: true });

  if (!chunks || chunks.length === 0) {
    return NextResponse.json({ error: "没有需要向量化的分块（可能已全部向量化或文档未解析）" }, { status: 400 });
  }

  try {
    // 批量调用 Embedding API
    const texts = chunks.map((c: { content: string }) => c.content);
    const vectors = await getEmbeddings(texts);

    // 逐条更新 embedding
    for (let i = 0; i < chunks.length; i++) {
      const { error } = await getSupabase()
        .from("document_chunks")
        .update({ embedding: vectors[i] })
        .eq("id", (chunks[i] as { id: string }).id);

      if (error) {
        return NextResponse.json({ error: `更新 chunk ${i} 失败: ${error.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({
      data: {
        chunk_count: chunks.length,
        dimensions: vectors[0]?.length || 0,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "向量化失败" },
      { status: 500 }
    );
  }
}
