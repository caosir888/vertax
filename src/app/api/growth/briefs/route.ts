import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/growth/briefs — 所有内容简报列表（支持筛选）
export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const db = getSupabase();
  const url = request.nextUrl.searchParams;
  const status = url.get("status");
  const funnel = url.get("funnel");
  const contentType = url.get("content_type");
  const search = url.get("search");
  const clusterId = url.get("cluster_id");
  const page = parseInt(url.get("page") || "1");
  const pageSize = parseInt(url.get("page_size") || "50");

  let query = db
    .from("content_briefs")
    .select("*, content_pillars!inner(id, name, cluster_id, intent_type, topic_clusters!inner(id, name, company_name))", { count: "exact" })
    .eq("team_id", user.team_id)
    .order("updated_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (funnel) query = query.eq("funnel_stage", funnel);
  if (contentType) query = query.eq("content_type", contentType);
  if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  if (clusterId) query = query.eq("content_pillars.cluster_id", clusterId);

  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const briefs = (data || []).map((b: Record<string, unknown>) => ({
    id: b.id,
    pillar_id: b.pillar_id,
    title: b.title,
    description: b.description,
    content_type: b.content_type,
    funnel_stage: b.funnel_stage,
    intent: b.intent,
    target_persona: b.target_persona,
    priority_question: b.priority_question,
    evidence_count: b.evidence_count,
    primary_channel: b.primary_channel,
    secondary_channel: b.secondary_channel,
    status: b.status,
    generated_content: b.generated_content,
    sort_order: b.sort_order,
    created_at: b.created_at,
    updated_at: b.updated_at,
    // denormalize pillar/cluster info
    pillar_name: (b.content_pillars as Record<string, unknown>)?.name || "",
    pillar_intent: (b.content_pillars as Record<string, unknown>)?.intent_type || "",
    cluster_id: ((b.content_pillars as Record<string, unknown>)?.topic_clusters as Record<string, unknown>)?.id || "",
    cluster_name: ((b.content_pillars as Record<string, unknown>)?.topic_clusters as Record<string, unknown>)?.company_name
      || ((b.content_pillars as Record<string, unknown>)?.topic_clusters as Record<string, unknown>)?.name || "",
  }));

  return NextResponse.json({ data: briefs, total: count || 0, page, page_size: pageSize });
}
