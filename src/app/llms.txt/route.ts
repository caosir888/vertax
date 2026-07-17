import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// GET /llms.txt — 公开端点，供 AI 爬虫（GPTBot, Claude, Perplexity 等）抓取
export async function GET() {
  const supabase = getSupabase();

  // 取最近 100 篇已发布内容
  const { data: contents } = await supabase
    .from("contents")
    .select("title, slug, content, tags, geo_data, seo_description, seo_title, updated_at")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (!contents?.length) {
    return new NextResponse("# llms.txt\n\nNo published content yet.\n", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const lines: string[] = [
    `# VertaX Content Hub`,
    `# Generated: ${new Date().toISOString().split("T")[0]}`,
    `# Total published: ${contents.length}`,
    ``,
    `## Site Info`,
    `Title: VertaX - AI-Powered B2B Growth Platform`,
    `Description: B2B content strategy platform for SEO, AEO, and GEO optimization`,
    ``,
  ];

  for (const c of contents) {
    const title = (c.seo_title || c.title || "").trim();
    const desc = (c.seo_description || "").trim();
    const summary = typeof c.content === "string" ? c.content.substring(0, 200).replace(/\n/g, " ") : "";
    const tags = Array.isArray(c.tags) ? c.tags.join(", ") : "";
    const updated = c.updated_at ? new Date(c.updated_at).toISOString().split("T")[0] : "";

    lines.push(`## ${title}`);
    if (desc) lines.push(`> ${desc}`);
    if (summary) lines.push(summary + "...");
    if (tags) lines.push(`Topics: ${tags}`);
    if (updated) lines.push(`Last updated: ${updated}`);
    lines.push("");
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
