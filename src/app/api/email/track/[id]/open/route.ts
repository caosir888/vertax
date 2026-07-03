import { NextResponse } from "next/server";
import { recordOpen } from "@/lib/email-campaign";

export const runtime = "nodejs";

// GET /api/email/track/[id]/open — 邮件打开追踪像素
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  recordOpen(id).catch(() => {});

  // 返回 1x1 透明 GIF
  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  );
  return new NextResponse(pixel, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
