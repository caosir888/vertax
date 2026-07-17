import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { getEmbedding, cosineSimilarity } from "@/lib/embedding";
import { chat, buildRagPrompt } from "@/lib/llm";

function parseEmbedding(emb: unknown): number[] {
  if (Array.isArray(emb)) return emb;
  if (typeof emb === "string") {
    try { return JSON.parse(emb); } catch { return []; }
  }
  return [];
}

// POST /api/chat — RAG 问答
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const { question, topK = 5, session_id, knowledge_base_id, document_id } = body;

  if (!question || !question.trim()) {
    return NextResponse.json({ error: "请输入问题" }, { status: 400 });
  }

  try {
    const queryVector = await getEmbedding(question.trim());
    const supabase = getSupabase();

    // 优先使用 pgvector RPC 进行向量搜索
    let chunks: { id: string; content: string; chunk_index: number; document_id: string; similarity: number }[] = [];

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("search_chunks", {
        query_embedding: queryVector,
        match_threshold: 0.4,
        match_count: topK,
        filter_team_id: user.team_id,
        filter_knowledge_base_id: knowledge_base_id || null,
      });

      if (!rpcError && rpcData) {
        chunks = (rpcData || []).map((r: { id: string; content: string; chunk_index: number; document_id: string; similarity: number }) => ({
          id: r.id,
          content: r.content,
          chunk_index: r.chunk_index,
          document_id: r.document_id,
          similarity: r.similarity,
        }));
      }
    } catch {
      // RPC 失败，回退到内存计算
    }

    // 回退：内存计算相似度
    if (chunks.length === 0) {
      let docsQuery = supabase
        .from("documents")
        .select("id")
        .eq("team_id", user.team_id);

      if (knowledge_base_id) {
        docsQuery = docsQuery.eq("knowledge_base_id", knowledge_base_id);
      }
      if (document_id) {
        docsQuery = docsQuery.eq("id", document_id);
      }

      const { data: teamDocs, error: docsError } = await docsQuery;

      if (docsError || !teamDocs || teamDocs.length === 0) {
        return NextResponse.json({
          data: {
            answer: "知识库中暂无相关内容，请先上传文档并完成向量化。",
            sources: [],
            debug: { team_id: user.team_id, docCount: teamDocs?.length || 0 },
          },
        });
      }

      const docIds = teamDocs.map((d: { id: string }) => d.id);

      const { data: rawData, error: rawError } = await supabase
        .from("document_chunks")
        .select("id, content, chunk_index, document_id, embedding")
        .in("document_id", docIds)
        .not("embedding", "is", null)
        .limit(topK * 20);

      if (rawError) {
        return NextResponse.json({ error: rawError.message }, { status: 500 });
      }

      chunks = (rawData || [])
        .map((chunk: { id: string; content: string; chunk_index: number; document_id: string; embedding: unknown }) => {
          const emb = parseEmbedding(chunk.embedding);
          return {
            id: chunk.id,
            content: chunk.content,
            chunk_index: chunk.chunk_index,
            document_id: chunk.document_id,
            similarity: emb.length > 0 ? cosineSimilarity(queryVector, emb) : 0,
          };
        })
        .filter((r) => r.similarity > 0.4)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);
    }

    // 获取文档名称
    const uniqueDocIds = [...new Set(chunks.map((c) => c.document_id))];
    const docMap = new Map<string, string>();
    if (uniqueDocIds.length > 0) {
      const { data: docs } = await supabase
        .from("documents")
        .select("id, name")
        .in("id", uniqueDocIds);
      (docs || []).forEach((d: { id: string; name: string }) => docMap.set(d.id, d.name));
    }

    let answer: string;
    let sources: { document_id: string; document_name: string; chunk_index: number; content: string; similarity: number }[] = [];

    if (chunks.length === 0) {
      answer = "知识库中暂无相关内容，请确认文档已上传、解析并完成向量化。如刚上传请稍等片刻再试。";
      return NextResponse.json({
        data: { answer, sources: [], debug: { team_id: user.team_id } },
      });
    } else {
      const ragChunks = chunks.map((c) => ({
        content: c.content,
        document_name: docMap.get(c.document_id) || "未知文档",
        chunk_index: c.chunk_index,
      }));

      const messages = buildRagPrompt(question.trim(), ragChunks);
      answer = await chat(messages);

      sources = chunks.map((c) => ({
        document_id: c.document_id,
        document_name: docMap.get(c.document_id) || "未知文档",
        chunk_index: c.chunk_index,
        content: c.content.substring(0, 200),
        similarity: c.similarity,
      }));
    }

    // 保存到聊天历史
    let sid = session_id;
    if (!sid) {
      const { data: newSession } = await supabase
        .from("chat_sessions")
        .insert({
          team_id: user.team_id,
          user_id: user.id,
          knowledge_base_id: knowledge_base_id || null,
          title: question.trim().substring(0, 50),
        })
        .select()
        .single();
      sid = newSession?.id;
    }

    if (sid) {
      await supabase.from("chat_messages").insert([
        { session_id: sid, role: "user", content: question.trim() },
        { session_id: sid, role: "assistant", content: answer, sources },
      ]);
    }

    return NextResponse.json({
      data: { answer, sources, session_id: sid },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "问答失败" },
      { status: 500 }
    );
  }
}
