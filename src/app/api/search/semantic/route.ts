import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { getEmbedding } from "@/lib/embedding";

// POST /api/search/semantic — 语义搜索
// Body: { query: "问题", topK?: 5 }
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const { query, topK = 5 } = body;

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
      match_threshold: 0.3,
      match_count: topK,
      filter_team_id: user.team_id,
    });

    if (error) {
      // 如果 RPC 函数不存在，回退到 raw SQL
      const { data: rawData, error: rawError } = await getSupabase()
        .from("document_chunks")
        .select("id, content, chunk_index, document_id, embedding")
        .eq("documents.team_id", user.team_id)
        .not("embedding", "is", null)
        .order("embedding", { ascending: false })
        .limit(topK);

      if (rawError) {
        return NextResponse.json({ error: rawError.message }, { status: 500 });
      }

      // 在内存中计算相似度并排序
      const results = (rawData || [])
        .map((chunk: { id: string; content: string; chunk_index: number; embedding: number[] }) => {
          let sim = 0;
          if (chunk.embedding && Array.isArray(chunk.embedding)) {
            // 计算余弦相似度
            let dot = 0, normA = 0, normB = 0;
            for (let i = 0; i < queryVector.length; i++) {
              dot += queryVector[i] * chunk.embedding[i];
              normA += queryVector[i] * queryVector[i];
              normB += chunk.embedding[i] * chunk.embedding[i];
            }
            sim = dot / (Math.sqrt(normA) * Math.sqrt(normB));
          }
          return { ...chunk, similarity: sim };
        })
        .filter((r: { similarity: number }) => r.similarity > 0.3)
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
