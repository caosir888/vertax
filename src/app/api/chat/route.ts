import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { getEmbedding } from "@/lib/embedding";
import { chat, buildRagPrompt } from "@/lib/llm";

// POST /api/chat — RAG 问答
// Body: { question: "问题", topK?: 5, document_id?: "限制某个文档" }
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const { question, topK = 5, document_id } = body;

  if (!question || !question.trim()) {
    return NextResponse.json({ error: "请输入问题" }, { status: 400 });
  }

  try {
    const queryVector = await getEmbedding(question.trim());

    // pgvector 语义搜索
    let chunks: { id: string; content: string; chunk_index: number; document_id: string; similarity: number }[] = [];

    const { data: rpcData, error: rpcError } = await getSupabase().rpc("search_chunks", {
      query_embedding: queryVector,
      match_threshold: 0.3,
      match_count: topK,
      filter_team_id: user.team_id,
    });

    if (rpcError) {
      // 回退：内存余弦相似度
      let query = getSupabase()
        .from("document_chunks")
        .select("id, content, chunk_index, document_id, embedding");

      if (document_id) {
        query = query.eq("document_id", document_id);
      }

      const { data: rawData, error: rawError } = await query
        .not("embedding", "is", null)
        .limit(100);

      if (rawError) {
        return NextResponse.json({ error: rawError.message }, { status: 500 });
      }

      chunks = (rawData || [])
        .map((chunk: { id: string; content: string; chunk_index: number; document_id: string; embedding: number[] }) => {
          let sim = 0;
          if (chunk.embedding && Array.isArray(chunk.embedding)) {
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
        .slice(0, topK);
    } else {
      chunks = rpcData || [];
    }

    if (chunks.length === 0) {
      return NextResponse.json({
        data: {
          answer: "知识库中暂无相关内容，请先上传文档并完成向量化。",
          sources: [],
        },
      });
    }

    // 获取文档名称
    const docIds = [...new Set(chunks.map((c) => c.document_id))];
    const { data: docs } = await getSupabase()
      .from("documents")
      .select("id, name")
      .in("id", docIds);

    const docMap = new Map((docs || []).map((d: { id: string; name: string }) => [d.id, d.name]));

    // 构建 RAG Prompt
    const ragChunks = chunks.map((c) => ({
      content: c.content,
      document_name: docMap.get(c.document_id) || "未知文档",
      chunk_index: c.chunk_index,
    }));

    const messages = buildRagPrompt(question.trim(), ragChunks);
    const answer = await chat(messages);

    // 来源引用
    const sources = chunks.map((c) => ({
      document_id: c.document_id,
      document_name: docMap.get(c.document_id) || "未知文档",
      chunk_index: c.chunk_index,
      content: c.content.substring(0, 200),
      similarity: c.similarity,
    }));

    return NextResponse.json({
      data: { answer, sources },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "问答失败" },
      { status: 500 }
    );
  }
}
