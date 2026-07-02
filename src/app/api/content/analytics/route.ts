import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { chat } from "@/lib/llm";

// GET /api/content/analytics — 内容分析数据
export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  // 内容排行榜（按发布时间最新）
  const { data: contents } = await getSupabase()
    .from("contents")
    .select("id,title,status,language,updated_at")
    .eq("team_id", user.team_id)
    .order("updated_at", { ascending: false });

  // 发布统计
  const { data: records } = await getSupabase()
    .from("publish_records")
    .select("platform")
    .eq("team_id", user.team_id);

  // 各平台发布次数
  const platformCount: Record<string, number> = {};
  (records || []).forEach((r: { platform: string }) => {
    platformCount[r.platform] = (platformCount[r.platform] || 0) + 1;
  });

  // 内容效果数据
  const { data: analytics } = await getSupabase()
    .from("content_analytics")
    .select("*")
    .eq("team_id", user.team_id)
    .order("views", { ascending: false })
    .limit(10);

  // 统计
  const total = (contents || []).length;
  const published = (contents || []).filter((c: { status: string }) => c.status === "published").length;
  const review = (contents || []).filter((c: { status: string }) => c.status === "review").length;
  const draft = total - published - review;

  return NextResponse.json({
    data: {
      stats: { total, published, review, draft, totalPublishes: (records || []).length },
      platformCount,
      topContent: (analytics || []).map((a: Record<string, unknown>) => ({
        ...a,
        engagement: (a.views as number || 0) + (a.likes as number || 0) * 2 + (a.comments as number || 0) * 5 + (a.shares as number || 0) * 3,
      })),
      recentContents: (contents || []).slice(0, 5),
    },
  });
}

// POST /api/content/analytics — 记录/更新内容效果
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const { content_id, platform = "", views = 0, likes = 0, comments = 0, shares = 0 } = body;

  if (!content_id) {
    return NextResponse.json({ error: "请指定内容" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("content_analytics")
    .upsert({
      content_id,
      team_id: user.team_id,
      platform,
      views,
      likes,
      comments,
      shares,
      recorded_at: new Date().toISOString(),
    }, { onConflict: "content_id" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// PATCH /api/content/analytics — AI 内容建议
export async function PATCH(_request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { data: contents } = await getSupabase()
    .from("contents")
    .select("title,status,template_id,language")
    .eq("team_id", user.team_id)
    .order("updated_at", { ascending: false })
    .limit(5);

  try {
    const titles = (contents || []).map((c: { title: string }) => c.title).join("、");
    const prompt = `基于以下最近内容，给出 3 个下一周内容选题建议（每个一行，格式：选题 + 简短理由）：
最近内容：${titles || "暂无"}
要求：中文输出，3个选题各一句话。`;

    const suggestion = await chat([{ role: "user", content: prompt }]);
    return NextResponse.json({ data: { suggestion } });
  } catch {
    return NextResponse.json({ data: { suggestion: "（需要配置 LLM_API_KEY 才能生成建议）" } });
  }
}
