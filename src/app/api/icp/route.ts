import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getICP, saveICP } from "@/lib/customer-profiling";

// GET /api/icp — 获取团队的 ICP 定义
export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const icp = await getICP(user.team_id!);
  return NextResponse.json({ data: icp });
}

// POST /api/icp — 创建或更新 ICP 定义
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const icp = await saveICP(user.team_id!, body);
  return NextResponse.json({ data: icp });
}
