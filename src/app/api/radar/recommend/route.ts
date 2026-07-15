import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getRadarRecommendations } from "@/lib/radar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const minScore = parseInt(request.nextUrl.searchParams.get("minScore") || "70", 10);
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20", 10);

  const leads = await getRadarRecommendations(user.team_id!, minScore, limit);
  return NextResponse.json({ data: leads });
}
