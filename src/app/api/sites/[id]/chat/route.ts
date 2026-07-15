import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { chat } from "@/lib/llm";
import { getEmbedding, cosineSimilarity } from "@/lib/embedding";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatRequestBody {
  question: string;
  session_id?: string;
  history?: { role: "user" | "assistant"; content: string }[];
}

function parseEmbedding(emb: unknown): number[] {
  if (Array.isArray(emb)) return emb;
  if (typeof emb === "string") {
    try { return JSON.parse(emb); } catch { return []; }
  }
  return [];
}

// POST /api/sites/[id]/chat — 独立站公开聊天（无需登录），连接知识库 RAG
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const { question, session_id, history } = body;

  if (!question || !question.trim()) {
    return NextResponse.json({ error: "问题不能为空" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: site, error } = await supabase
    .from("sites")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !site) {
    return NextResponse.json({ error: "站点不存在" }, { status: 404 });
  }

  const pages: { title: string; content: string }[] =
    typeof site.pages === "string" ? JSON.parse(site.pages) : site.pages;
  const settings: Record<string, unknown> =
    typeof site.settings === "string" ? JSON.parse(site.settings) : site.settings;

  if (!settings?.enableChat) {
    return NextResponse.json({ error: "该站点未开启在线咨询" }, { status: 403 });
  }

  const companyName = String(settings.companyName || "本站");
  const teamId = site.team_id as string;

  // 站点页面内容
  const siteContext = (pages || [])
    .map((p: { title: string; content: string }) => `[${p.title}]\n${p.content}`)
    .join("\n\n");

  // 知识库 RAG 检索
  let ragContext = "";
  try {
    const queryVector = await getEmbedding(question.trim());

    const { data: teamDocs } = await supabase
      .from("documents")
      .select("id")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });

    const docIds = teamDocs?.map((d: { id: string }) => d.id) || [];

    if (docIds.length > 0) {
      const { data: rawChunks } = await supabase
        .from("document_chunks")
        .select("id, content, chunk_index, document_id, embedding")
        .in("document_id", docIds)
        .not("embedding", "is", null)
        .limit(50);

      const chunks = (rawChunks || [])
        .map((c: { id: string; content: string; chunk_index: number; document_id: string; embedding: unknown }) => {
          const emb = parseEmbedding(c.embedding);
          return {
            id: c.id,
            content: c.content,
            chunk_index: c.chunk_index,
            document_id: c.document_id,
            similarity: emb.length > 0 ? cosineSimilarity(queryVector, emb) : 0,
          };
        })
        .filter((r) => r.similarity > 0.2)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);

      if (chunks.length > 0) {
        ragContext = chunks
          .map((c, i) => `[知识库${i + 1}]\n${c.content}`)
          .join("\n\n");
      }
    }
  } catch {
    // 知识库检索失败不影响对话，降级到仅用站点内容
  }

  // 历史消息
  const historyMessages: { role: "system" | "user" | "assistant"; content: string }[] = [];
  if (history && Array.isArray(history)) {
    for (const msg of history.slice(-10)) {
      if (msg.role === "user" || msg.role === "assistant") {
        historyMessages.push({ role: msg.role, content: msg.content });
      }
    }
  }

  // 构建 prompt：知识库优先，站点内容作为补充
  const ragChunks = ragContext
    ? [{ content: ragContext, document_name: "知识库" }]
    : [];

  if (!ragContext) {
    // 无知识库结果时用站点内容
    ragChunks.push({ content: siteContext, document_name: "网站内容" });
  }

  const systemPrompt = `你是${companyName}的在线客服助手。请根据以下内容回答访客的问题。${ragContext ? "\n优先参考知识库中的产品信息和技术细节，网站内容作为品牌和公司背景补充。" : ""}

${ragContext ? "知识库内容：\n" + ragContext : ""}

网站内容：
${siteContext}

规则：
1. 只根据提供的内容回答，不要编造信息
2. 如果内容中确实没有相关信息，请礼貌地说"抱歉，我暂时无法回答这个问题，建议您通过联系方式直接咨询我们"
3. 回答要友好、专业、简洁，用中文
4. 适当引导访客了解更多产品细节或联系公司
5. 如果是询价类问题，提供已有信息后引导访客留言咨询`;

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...historyMessages,
    { role: "user", content: question.trim() },
  ];

  try {
    const answer = await chat(messages);

    const sid =
      session_id ||
      `site_${id}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    return NextResponse.json({
      data: { answer, session_id: sid },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI 服务暂时不可用" },
      { status: 500 }
    );
  }
}
