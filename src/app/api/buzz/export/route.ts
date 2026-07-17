import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/buzz/export — 导出提及数据为 CSV
export async function GET(_request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("buzz_mentions")
    .select("title, source, snippet, sentiment, status, platforms, mention_date, created_at, buzz_monitors(name)")
    .eq("team_id", user.team_id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const statusLabel: Record<string, string> = { draft: "草稿", published: "已发布", failed: "发布失败" };
  const sentimentLabel: Record<string, string> = { positive: "正面", negative: "负面", neutral: "中性", "": "未标记" };

  const header = "标题,来源,摘要,情感,状态,平台,日期,监控器\n";
  const rows = (data || []).map((m: Record<string, unknown>) => {
    const title = `"${(m.title as string || "").replace(/"/g, '""')}"`;
    const source = `"${(m.source as string || "").replace(/"/g, '""')}"`;
    const snippet = `"${(m.snippet as string || "").replace(/"/g, '""')}"`;
    const sentiment = sentimentLabel[m.sentiment as string] || "未标记";
    const status = statusLabel[m.status as string] || "草稿";
    const platforms = (m.platforms as string[])?.join("/") || "";
    const date = m.mention_date || "";
    const monitor = ((m.buzz_monitors as { name: string })?.name) || "";
    return `${title},${source},${snippet},${sentiment},${status},${platforms},${date},${monitor}`;
  }).join("\n");

  const csv = header + rows;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=buzz_export.csv",
    },
  });
}
