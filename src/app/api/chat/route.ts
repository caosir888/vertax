import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { getEmbedding, cosineSimilarity } from "@/lib/embedding";
import { chat, buildRagPrompt } from "@/lib/llm";

// POST /api/chat — RAG 问答（自动保存到聊天历史）
// Body: {
//   question: "问题", topK?: 5,
//   session_id?: "已有会话ID，不传则自动创建",
//   knowledge_base_id?: "限制某个知识库",
//   document_id?: "限制某个文档"
// }
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

    // pgvector 语义搜索
    let chunks: { id: string; content: string; chunk_index: number; document_id: string; similarity: number }[] = [];

    const { data: rpcData, error: rpcError } = await getSupabase().rpc("search_chunks", {
      query_embedding: JSON.stringify(queryVector), // pgvector 需要字符串格式
      match_threshold: 0.5,
      match_count: topK,
      filter_team_id: user.team_id,
      filter_knowledge_base_id: knowledge_base_id || null,
    });

    if (rpcError) {
      // 回退：通过 documents 表获取 team 内的文档
      let docsQuery = getSupabase()
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

      if (docsError) {
        return NextResponse.json({ error: docsError.message }, { status: 500 });
      }

      const docIds = teamDocs?.map((d: { id: string }) => d.id) || [];
      if (docIds.length === 0) {
        return NextResponse.json({
          data: {
            answer: "知识库中暂无相关内容，请先上传文档并完成向量化。",
            sources: [],
          },
        });
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

      // pgvector 返回的 embedding 可能是字符串 "[0.1,0.2,...]" 而非数组
      function parseEmbedding(emb: unknown): number[] {
        if (Array.isArray(emb)) return emb;
        if (typeof emb === "string") {
          try { return JSON.parse(emb); } catch { return []; }
        }
        return [];
      }

      chunks = (rawData || [])
        .map((chunk: { id: string; content: string; chunk_index: number; document_id: string; embedding: unknown }) => {
          const emb = parseEmbedding(chunk.embedding);
          return {
            ...chunk,
            embedding: emb,
            similarity: emb.length > 0 ? cosineSimilarity(queryVector, emb) : 0,
          };
        })
        .filter((r: { similarity: number }) => r.similarity > 0.5)
        .sort((a: { similarity: number }, b: { similarity: number }) => b.similarity - a.similarity)
        .slice(0, topK);
    } else {
      chunks = rpcData || [];
    }

    // 获取文档名称
    const docIds = [...new Set(chunks.map((c) => c.document_id))];
    const docMap = new Map<string, string>();
    if (docIds.length > 0) {
      const { data: docs } = await getSupabase()
        .from("documents")
        .select("id, name")
        .in("id", docIds);
      (docs || []).forEach((d: { id: string; name: string }) => docMap.set(d.id, d.name));
    }

    // 构建 RAG Prompt + 调用 LLM
    let answer: string;
    let sources: { document_id: string; document_name: string; chunk_index: number; content: string; similarity: number }[] = [];

    if (chunks.length === 0) {
      answer = "知识库中暂无相关内容，请先上传文档并完成向量化。";
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
      const { data: newSession } = await getSupabase()
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
      const { error: saveError } = await getSupabase().from("chat_messages").insert([
        { session_id: sid, role: "user", content: question.trim() },
        { session_id: sid, role: "assistant", content: answer, sources },
      ]);
      if (saveError) {
        console.error("保存聊天历史失败:", saveError.message);
      }
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
