import { NextResponse } from "next/server";
import { getAllPlans } from "@/lib/plans";

export async function GET() {
  return NextResponse.json({ data: getAllPlans() });
}
