import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// GET /api/opportunities/stats — 管道统计
export async function GET(_request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { data, error } = await getSupabase()
    .from("opportunities")
    .select("*")
    .eq("team_id", user.team_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data || [];
  const openStages = ["initial_contact", "needs_confirmation", "proposal_quote", "negotiation"];

  let total_pipeline_value = 0;
  let weighted_pipeline_value = 0;
  const stage_counts: Record<string, number> = {
    initial_contact: 0,
    needs_confirmation: 0,
    proposal_quote: 0,
    negotiation: 0,
    won: 0,
    lost: 0,
  };
  const stage_values: Record<string, number> = {
    initial_contact: 0,
    needs_confirmation: 0,
    proposal_quote: 0,
    negotiation: 0,
    won: 0,
    lost: 0,
  };

  for (const row of rows) {
    const value = Number(row.deal_value) || 0;
    const prob = Number(row.probability) || 0;

    stage_counts[row.stage] = (stage_counts[row.stage] || 0) + 1;
    stage_values[row.stage] = (stage_values[row.stage] || 0) + value;

    if (openStages.includes(row.stage)) {
      total_pipeline_value += value;
      weighted_pipeline_value += value * (prob / 100);
    }
  }

  return NextResponse.json({
    data: {
      total_count: rows.length,
      total_pipeline_value,
      weighted_pipeline_value,
      stage_counts,
      stage_values,
    },
  });
}
