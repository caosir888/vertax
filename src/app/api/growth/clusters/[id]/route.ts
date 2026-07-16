import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";

// GET /api/growth/clusters/[id] — 获取单个集群详情（含 pillars + briefs）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const db = getSupabase();

  const { data: cluster, error } = await db
    .from("topic_clusters")
    .select("*")
    .eq("id", id)
    .eq("team_id", user.team_id)
    .single();

  if (error || !cluster) {
    return NextResponse.json({ error: "集群不存在" }, { status: 404 });
  }

  const { data: pillars } = await db
    .from("content_pillars")
    .select("*")
    .eq("cluster_id", id)
    .order("sort_order", { ascending: true });

  const enrichedPillars = await Promise.all(
    (pillars || []).map(async (p) => {
      const { data: briefs } = await db
        .from("content_briefs")
        .select("*")
        .eq("pillar_id", p.id)
        .order("sort_order", { ascending: true });
      const { data: evidence } = await db
        .from("evidence_items")
        .select("id,content,source,source_type")
        .eq("pillar_id", p.id);
      return { ...p, briefs: briefs || [], evidence: evidence || [] };
    })
  );

  return NextResponse.json({ data: { ...cluster, pillars: enrichedPillars } });
}

// PATCH /api/growth/clusters/[id] — 更新集群
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of ["name", "company_name", "company_context", "buyer_context", "problem_map", "distribution_channels", "status"]) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  const db = getSupabase();
  const { data, error } = await db
    .from("topic_clusters")
    .update(updates)
    .eq("id", id)
    .eq("team_id", user.team_id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logActivity({
    team_id: user.team_id!,
    user_id: user.id,
    user_name: user.name,
    action: "update_topic_cluster",
    target: id,
    details: Object.keys(updates).filter((k) => k !== "updated_at").join(", "),
  });

  return NextResponse.json({ data });
}

// DELETE /api/growth/clusters/[id] — 删除集群（级联删除 pillars + briefs）
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const db = getSupabase();
  const { error } = await db
    .from("topic_clusters")
    .delete()
    .eq("id", id)
    .eq("team_id", user.team_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logActivity({
    team_id: user.team_id!,
    user_id: user.id,
    user_name: user.name,
    action: "delete_topic_cluster",
    target: id,
  });

  return NextResponse.json({ data: null });
}
