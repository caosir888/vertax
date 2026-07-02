import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { siteTemplates, renderSiteHTML, type SiteSettings } from "@/lib/templates-site";

// GET /api/sites/[id]/preview — 公开预览已发布的独立站（无需登录）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await getSupabase()
    .from("sites")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "站点不存在" }, { status: 404 });
  }

  if (data.status !== "published") {
    return NextResponse.json({ error: "站点未发布" }, { status: 403 });
  }

  const template = siteTemplates.find((t) => t.id === data.template_id);
  if (!template) {
    return NextResponse.json({ error: "模板不存在" }, { status: 500 });
  }

  const pages = typeof data.pages === "string" ? JSON.parse(data.pages) : data.pages;
  const settings: SiteSettings = typeof data.settings === "string" ? JSON.parse(data.settings) : data.settings;

  const html = renderSiteHTML(template, pages, settings);

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
