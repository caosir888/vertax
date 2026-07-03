import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { validateApiKey, extractApiKey } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";
import { getEmbedding } from "@/lib/embedding";

// GET /api/v1/knowledge/search?q=xxx&kb_id=xxx&top=5
export async function GET(request: NextRequest) {
  const apiKey = extractApiKey(request);
  if (!apiKey) {
    return NextResponse.json({ error: "缺少 API Key" }, { status: 401 });
  }

  const auth = await validateApiKey(apiKey);
  if (!auth.valid || !auth.team_id) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const rl = rateLimit(`v1_knowledge_${auth.team_id}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
  }

  const params = request.nextUrl.searchParams;
  const q = params.get("q");
  const kbId = params.get("kb_id");
  const top = Math.min(parseInt(params.get("top") || "5"), 10);

  if (!q?.trim()) {
    return NextResponse.json({ error: "q 参数不能为空" }, { status: 400 });
  }

  try {
    const embedding = await getEmbedding(q.trim());

    const { data, error } = await getSupabase().rpc("search_chunks", {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: top,
      filter_team_id: auth.team_id,
      filter_knowledge_base_id: kbId || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, query: q.trim() });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "搜索失败" }, { status: 500 });
  }
}
