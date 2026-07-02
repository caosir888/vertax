import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { getEmbedding, cosineSimilarity } from "@/lib/embedding";

// POST /api/search/semantic — 语义搜索
// Body: { query: "问题", topK?: 5, knowledge_base_id?: "xxx" }
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const { query, topK = 5, knowledge_base_id } = body;

  if (!query || !query.trim()) {
    return NextResponse.json({ error: "请输入搜索内容" }, { status: 400 });
  }

  try {
    // 将问题向量化
    const queryVector = await getEmbedding(query.trim());

    // pgvector 余弦相似度搜索
    // 使用 <=> 运算符（余弦距离），1 - 距离 = 相似度
    const { data, error } = await getSupabase().rpc("search_chunks", {
      query_embedding: queryVector,
      match_threshold: 0.5,
      match_count: topK,
      filter_team_id: user.team_id,
      filter_knowledge_base_id: knowledge_base_id || null,
    });

    if (error) {
      // 回退：通过 documents 表获取 team 内的文档ID，再查分块
      let docsQuery = getSupabase()
        .from("documents")
        .select("id")
        .eq("team_id", user.team_id);

      if (knowledge_base_id) {
        docsQuery = docsQuery.eq("knowledge_base_id", knowledge_base_id);
      }

      const { data: teamDocs, error: docsError } = await docsQuery;

      if (docsError) {
        return NextResponse.json({ error: docsError.message }, { status: 500 });
      }

      const docIds = teamDocs?.map((d: { id: string }) => d.id) || [];
      if (docIds.length === 0) {
        return NextResponse.json({ data: [] });
      }

      const { data: rawData, error: rawError } = await getSupabase()
        .from("document_chunks")
        .select("id, content, chunk_index, document_id, embedding")
        .in("document_id", docIds)
        .not("embedding", "is", null)
        .limit(topK * 20);

      if (rawError) {
        return NextResponse.json({ error: rawError.message }, { status: 500 });
      }

      // 在内存中计算相似度并排序
      const results = (rawData || [])
        .map((chunk: { id: string; content: string; chunk_index: number; embedding: number[] }) => ({
          ...chunk,
          similarity: chunk.embedding && Array.isArray(chunk.embedding)
            ? cosineSimilarity(queryVector, chunk.embedding)
            : 0,
        }))
        .filter((r: { similarity: number }) => r.similarity > 0.5)
        .sort((a: { similarity: number }, b: { similarity: number }) => b.similarity - a.similarity)
        .slice(0, topK)
        .map(({ embedding, ...rest }: { embedding?: unknown; id: string; content: string; chunk_index: number; similarity: number }) => rest);

      return NextResponse.json({ data: results });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "搜索失败" },
      { status: 500 }
    );
  }
}
