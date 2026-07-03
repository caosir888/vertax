import { NextRequest, NextResponse } from "next/server";
import { recordClick } from "@/lib/email-campaign";

// GET /api/email/track/[id]/click — 邮件点击追踪
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = request.nextUrl.searchParams.get("url") || "/";
  recordClick(id).catch(() => {});

  return NextResponse.redirect(url);
}
