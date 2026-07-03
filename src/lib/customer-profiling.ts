import { getSupabase } from "@/lib/supabase";
import { chat } from "@/lib/llm";
import { logActivity } from "@/lib/activity-logger";

interface ICPDefinition {
  id?: string;
  team_id: string;
  name: string;
  industries: string[];
  company_size: string;
  roles: string[];
  pain_points: string[];
  budget_range: string;
  tech_stack: string[];
  geo_regions: string[];
  description: string;
}

interface LeadForProfile {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  notes: string;
  team_id: string;
}

interface ProfileResult {
  score: number;
  company_summary: string;
  decision_maker_analysis: string;
  pain_point_match: string;
  recommended_approach: string;
  risk_factors: string;
  raw_analysis: string;
}

export async function getICP(teamId: string): Promise<ICPDefinition | null> {
  const { data } = await getSupabase()
    .from("icp_definitions")
    .select("*")
    .eq("team_id", teamId)
    .limit(1)
    .maybeSingle();
  return data as ICPDefinition | null;
}

export async function saveICP(teamId: string, icp: Partial<ICPDefinition>): Promise<ICPDefinition> {
  const existing = await getICP(teamId);
  if (existing) {
    const { data } = await getSupabase()
      .from("icp_definitions")
      .update({ ...icp, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single();
    return data as ICPDefinition;
  }
  const { data } = await getSupabase()
    .from("icp_definitions")
    .insert({ team_id: teamId, ...icp })
    .select()
    .single();
  return data as ICPDefinition;
}

function buildProfilePrompt(lead: LeadForProfile, icp: ICPDefinition | null) {
  const icpSection = icp
    ? `
## 理想客户画像 (ICP)
- 目标行业: ${icp.industries?.join(", ") || "未定义"}
- 公司规模: ${icp.company_size || "未定义"}
- 目标角色: ${icp.roles?.join(", ") || "未定义"}
- 客户痛点: ${icp.pain_points?.join(", ") || "未定义"}
- 预算范围: ${icp.budget_range || "未定义"}
- 目标地区: ${icp.geo_regions?.join(", ") || "未定义"}
- 补充说明: ${icp.description || "无"}`
    : "（未配置 ICP，请基于通用 B2B SaaS 标准判断）";

  return `你是一个 B2B 客户画像分析专家。请分析以下线索，并给出评估。

## 线索信息
- 联系人: ${lead.name}
- 公司: ${lead.company || "未知"}
- 邮箱: ${lead.email || "未知"}
- 电话: ${lead.phone || "未知"}
- 来源渠道: ${lead.source || "未知"}
- 当前状态: ${lead.status}
- 备注: ${lead.notes || "无"}

${icpSection}

请以 JSON 格式返回以下字段（不要包含其他文字）：
{
  "score": <0-100 整数，表示该线索与 ICP 的匹配度>,
  "company_summary": "<对目标公司的简要分析，1-2 句>",
  "decision_maker_analysis": "<对联系人的决策权/影响力分析，1-2 句>",
  "pain_point_match": "<该客户痛点与产品解决方案的匹配分析>",
  "recommended_approach": "<推荐的跟进策略，2-3 句>",
  "risk_factors": "<可能的风险因素（竞品、预算、时机等）>",
  "raw_analysis": "<综合分析摘要>"
}`;
}

export async function generateLeadProfile(
  lead: LeadForProfile,
  icp: ICPDefinition | null,
  userId: string,
  userName: string
): Promise<ProfileResult> {
  const prompt = buildProfilePrompt(lead, icp);
  const response = await chat([
    { role: "system", content: "你是一个专业的 B2B 客户画像分析师。请严格按照 JSON 格式返回分析结果，不要包含 JSON 之外的任何内容。" },
    { role: "user", content: prompt },
  ]);

  let result: ProfileResult;
  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
    result = JSON.parse(cleaned);
    if (typeof result.score !== "number" || result.score < 0 || result.score > 100) {
      result.score = Math.max(0, Math.min(100, Number(result.score) || 50));
    }
  } catch {
    result = {
      score: 50,
      company_summary: "AI 分析暂时不可用，请稍后重试",
      decision_maker_analysis: "",
      pain_point_match: "",
      recommended_approach: "",
      risk_factors: "",
      raw_analysis: response.substring(0, 500),
    };
  }

  // 保存到数据库
  await getSupabase()
    .from("customer_profiles")
    .upsert({
      lead_id: lead.id,
      team_id: lead.team_id,
      ...result,
      updated_at: new Date().toISOString(),
    }, { onConflict: "lead_id" });

  logActivity({
    team_id: lead.team_id,
    user_id: userId,
    user_name: userName,
    action: "生成客户画像",
    target: `线索 ${lead.name} (${lead.company})`,
    details: `匹配度: ${result.score}/100`,
  });

  return result;
}

export async function getLeadProfile(leadId: string): Promise<ProfileResult | null> {
  const { data } = await getSupabase()
    .from("customer_profiles")
    .select("*")
    .eq("lead_id", leadId)
    .maybeSingle();
  if (!data) return null;
  return {
    score: data.score,
    company_summary: data.company_summary,
    decision_maker_analysis: data.decision_maker_analysis,
    pain_point_match: data.pain_point_match,
    recommended_approach: data.recommended_approach,
    risk_factors: data.risk_factors,
    raw_analysis: data.raw_analysis,
  };
}
