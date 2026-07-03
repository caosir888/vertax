import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// GET /api/sites/[id]/robots — 公开访问，返回 robots.txt
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: site } = await getSupabase()
    .from("sites")
    .select("id, settings, status")
    .eq("id", id)
    .single();

  if (!site || site.status !== "published") {
    return new NextResponse("Site not found", { status: 404 });
  }

  const settings = typeof site.settings === "string" ? JSON.parse(site.settings) : (site.settings || {});
  const customDomain = (settings as Record<string, string>).customDomain;
  const baseUrl = customDomain
    ? `https://${customDomain}`
    : `${request.nextUrl.protocol}//${request.nextUrl.host}`;

  const sitemapUrl = `${baseUrl}/api/sites/${id}/sitemap`;

  const txt = `User-agent: *
Allow: /
Sitemap: ${sitemapUrl}
`;

  return new NextResponse(txt, {
    headers: { "Content-Type": "text/plain" },
  });
}
