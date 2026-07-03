import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// GET /api/sites/[id]/sitemap — 公开访问，返回 sitemap.xml
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: site } = await getSupabase()
    .from("sites")
    .select("id, pages, settings, status")
    .eq("id", id)
    .single();

  if (!site || site.status !== "published") {
    return new NextResponse("Site not found", { status: 404 });
  }

  const settings = typeof site.settings === "string" ? JSON.parse(site.settings) : (site.settings || {});
  const pages: { slug: string }[] = typeof site.pages === "string" ? JSON.parse(site.pages) : (site.pages || []);
  const customDomain = (settings as Record<string, string>).customDomain;
  const baseUrl = customDomain
    ? `https://${customDomain}`
    : `${request.nextUrl.protocol}//${request.nextUrl.host}/api/sites/${id}/preview`;

  const urls = [
    { loc: baseUrl, priority: "1.0", changefreq: "weekly" },
    ...pages.map((p) => ({
      loc: `${baseUrl}#${p.slug}`,
      priority: "0.8",
      changefreq: "monthly",
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
