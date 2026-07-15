import { getSupabase } from "@/lib/supabase";
import { chat } from "@/lib/llm";
import { getICP } from "@/lib/customer-profiling";
import { logActivity } from "@/lib/activity-logger";

interface DiscoveredLead {
  name: string;
  company: string;
  title: string;
  email: string;
  industry: string;
  notes: string;
}

export function buildDiscoveryPrompt(icp: Record<string, unknown>, count = 20): string {
  const industries = (icp.industries as string[])?.join(", ") || "不限";
  const companySize = icp.company_size || "不限";
  const roles = (icp.roles as string[])?.join(", ") || "不限";
  const painPoints = (icp.pain_points as string[])?.join(", ") || "不限";
  const regions = (icp.geo_regions as string[])?.join(", ") || "不限";
  const description = icp.description || "";

  return `你是一个专业的 B2B 潜在客户发现助手。请根据以下理想客户画像，生成 ${count} 个真实的潜在客户线索。

## 理想客户画像
- 目标行业: ${industries}
- 公司规模: ${companySize}
- 目标角色/职位: ${roles}
- 客户痛点: ${painPoints}
- 目标地区: ${regions}
- 补充说明: ${description}

## 要求
1. 生成的客户信息要真实、具体、多样化
2. 公司名称要真实存在或接近真实的名称
3. 联系人姓名要符合地区文化习惯
4. 邮箱使用对应公司的域名（如 name@company.com）
5. 行业要精确匹配目标画像
6. 备注中说明该客户为什么是潜在客户（与痛点匹配的原因）

## 输出格式
严格按以下 JSON 数组格式返回（不要包含任何其他文字）：

[
  {
    "name": "联系人姓名",
    "company": "公司名称",
    "title": "职位",
    "email": "邮箱地址",
    "industry": "所属行业",
    "notes": "为什么是潜在客户，与ICP匹配的原因（1-2句）"
  }
]

只返回 JSON 数组，不要包含 markdown 代码块标记。`;
}

export function parseDiscoveryResponse(text: string): DiscoveredLead[] {
  try {
    const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item: Record<string, unknown>) => item.name && item.company)
        .slice(0, 20);
    }
    return [];
  } catch {
    // Try to extract JSON array from text
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]).filter(
          (item: Record<string, unknown>) => item.name && item.company
        );
      } catch {
        return [];
      }
    }
    return [];
  }
}

export async function runRadarSearch(
  teamId: string,
  userId: string,
  userName: string
): Promise<{ jobId?: string; leadsFound: number; error?: string }> {
  const supabase = getSupabase();

  // Get ICP
  const icp = await getICP(teamId);
  if (!icp) {
    return { leadsFound: 0, error: "请先配置目标客户画像 (ICP)" };
  }

  // Create search job (optional table)
  let jobId: string | undefined;
  try {
    const { data: job } = await supabase
      .from("radar_search_jobs")
      .insert({
        team_id: teamId,
        icp_id: (icp as unknown as Record<string, string>).id,
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();
    jobId = job?.id;
  } catch {
    // Table may not exist yet — continue without tracking
  }

  try {
    // Generate leads via LLM
    const prompt = buildDiscoveryPrompt(icp as unknown as Record<string, unknown>, 20);
    const response = await chat([
      {
        role: "system",
        content:
          "你是一个专业的 B2B 客户发现助手。请严格按照 JSON 格式返回结果，不要包含 JSON 之外的任何内容。",
      },
      { role: "user", content: prompt },
    ]);

    const discovered = parseDiscoveryResponse(response);

    if (discovered.length === 0) {
      if (jobId) {
        await supabase
          .from("radar_search_jobs")
          .update({ status: "failed", error_message: "AI 未返回有效线索", completed_at: new Date().toISOString() })
          .eq("id", jobId);
      }
      return { jobId, leadsFound: 0, error: "AI 未返回有效线索，请重试" };
    }

    // Insert leads into leads table
    const leads = discovered.map((d) => ({
      team_id: teamId,
      user_id: userId,
      name: d.name,
      company: d.company,
      email: d.email,
      phone: "",
      status: "new",
      source: "radar",
      notes: `${d.title ? `职位: ${d.title}\n` : ""}行业: ${d.industry}\n\nICP 匹配分析: ${d.notes}`,
    }));

    const { error: insertError } = await supabase.from("leads").insert(leads);

    if (insertError) {
      if (jobId) {
        await supabase
          .from("radar_search_jobs")
          .update({ status: "failed", error_message: insertError.message, completed_at: new Date().toISOString() })
          .eq("id", jobId);
      }
      return { jobId, leadsFound: 0, error: insertError.message };
    }

    // Update job
    if (jobId) {
      await supabase
        .from("radar_search_jobs")
        .update({ status: "completed", leads_found: discovered.length, completed_at: new Date().toISOString() })
        .eq("id", jobId);
    }

    // Auto-generate AI profiles for new leads (async, non-blocking)
    // Profiles will be generated when user views them — otherwise it takes too long

    logActivity({
      team_id: teamId,
      user_id: userId,
      user_name: userName,
      action: "自动搜索线索",
      target: `发现 ${discovered.length} 个潜在客户`,
    });

    return { jobId, leadsFound: discovered.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : "搜索失败";
    if (jobId) {
      await supabase
        .from("radar_search_jobs")
        .update({ status: "failed", error_message: message, completed_at: new Date().toISOString() })
        .eq("id", jobId);
    }
    return { jobId, leadsFound: 0, error: message };
  }
}

export async function getRadarStats(teamId: string) {
  const supabase = getSupabase();

  const [
    { count: totalNew },
    { count: totalFollowed },
    { data: highScoreData },
    { data: lastJob },
  ] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("team_id", teamId).eq("source", "radar"),
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("team_id", teamId).neq("status", "new"),
    supabase.from("customer_profiles").select("score, lead_id").eq("team_id", teamId).gte("score", 70),
    (async () => {
      try {
        const { data } = await supabase
          .from("radar_search_jobs")
          .select("*")
          .eq("team_id", teamId)
          .eq("status", "completed")
          .order("completed_at", { ascending: false })
          .limit(1);
        return { data };
      } catch {
        return { data: null };
      }
    })(),
  ]);

  return {
    newDiscoveries: totalNew || 0,
    highScore: highScoreData?.length || 0,
    followedUp: totalFollowed || 0,
    lastScan: lastJob?.[0]?.completed_at || null,
    latestJob: lastJob?.[0] || null,
  };
}

export async function getRadarRecommendations(
  teamId: string,
  minScore = 70,
  limit = 20
) {
  const supabase = getSupabase();

  const { data: profiles } = await supabase
    .from("customer_profiles")
    .select("lead_id, score")
    .eq("team_id", teamId)
    .gte("score", minScore)
    .order("score", { ascending: false })
    .limit(limit);

  if (!profiles?.length) return [];

  const leadIds = profiles.map((p: { lead_id: string }) => p.lead_id);
  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .in("id", leadIds)
    .eq("team_id", teamId);

  if (!leads?.length) return [];

  const scoreMap = new Map(
    profiles.map((p: { lead_id: string; score: number }) => [p.lead_id, p.score])
  );

  return leads.map((l: Record<string, unknown>) => ({
    ...l,
    ai_score: scoreMap.get(l.id as string) || 0,
  }));
}
