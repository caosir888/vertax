import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return NextResponse.json({
    supabaseUrl: url ? url.substring(0, 30) + "..." : "未配置",
    supabaseKey: key ? key.substring(0, 20) + "..." : "未配置",
  });
}
