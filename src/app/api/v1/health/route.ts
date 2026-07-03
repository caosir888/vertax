import { NextResponse } from "next/server";
import { validateApiKey, extractApiKey } from "@/lib/api-auth";

export async function GET(request: Request) {
  const apiKey = extractApiKey(request);
  if (!apiKey) {
    return NextResponse.json({ error: "缺少 API Key，请在 Authorization header 中使用 Bearer <api_key>" }, { status: 401 });
  }

  const result = await validateApiKey(apiKey);
  if (!result.valid) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  return NextResponse.json({
    status: "ok",
    team_id: result.team_id,
    version: "v1",
    timestamp: new Date().toISOString(),
  });
}
