import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getRadarStats } from "@/lib/radar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const stats = await getRadarStats(user.team_id!);
  return NextResponse.json({ data: stats });
}
