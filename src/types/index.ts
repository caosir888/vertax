// ========== 用户相关 ==========

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  created_at: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  team_id?: string;
}

// ========== 备忘录相关 ==========

export interface Memo {
  id: string;
  user_id: string;
  team_id: string;
  title: string;
  content: string;
  created_at: string;
}

// ========== API 响应格式 ==========

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// ========== 团队相关 ==========

export interface Team {
  id: string;
  name: string;
  company_name?: string;
  industry?: string;
  logo_url?: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: Role;
  user_name: string;
  user_email: string;
  created_at: string;
}

// ========== API Key 相关 ==========

export interface ApiKey {
  id: string;
  team_id: string;
  name: string;
  key: string;
  created_at: string;
  last_used_at?: string;
}

// ========== 知识库文档 ==========

export interface Document {
  id: string;
  team_id: string;
  user_id: string;
  name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  status: string;
  created_at: string;
}

// ========== 通用类型 ==========

export type Role = "owner" | "admin" | "editor" | "viewer";

export type Status = "draft" | "review" | "published";

// ========== 内容评论 ==========

export interface ContentComment {
  id: string;
  content_id: string;
  team_id: string;
  user_id: string;
  user_name: string;
  body: string;
  created_at: string;
}

// ========== 任务 ==========

export interface Task {
  id: string;
  team_id: string;
  creator_id: string;
  assignee_id?: string;
  assignee_name?: string;
  target_type?: string;
  target_id?: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  created_at: string;
  updated_at: string;
}

// ========== 在线状态 ==========

export interface UserPresence {
  id: string;
  user_id: string;
  team_id: string;
  user_name: string;
  current_page: string;
  last_seen_at: string;
}

// ========== 订阅方案 ==========

export interface PlanInfo {
  id: "free" | "pro" | "enterprise";
  name: string;
  price: number;
  priceLabel: string;
  features: string[];
  limits: {
    maxMembers: number;
    maxSites: number;
    maxContent: number;
    maxAIGenerations: number;
  };
}

export interface SubscriptionInfo {
  plan: string;
  subscription_status: string;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  limits: PlanInfo["limits"];
}

// ========== 采购机会 ==========

export type OpportunityStage =
  | "initial_contact"
  | "needs_confirmation"
  | "proposal_quote"
  | "negotiation"
  | "won"
  | "lost";

export interface Opportunity {
  id: string;
  team_id: string;
  user_id: string;
  lead_id?: string;
  name: string;
  company: string;
  contact_name: string;
  stage: OpportunityStage;
  deal_value: number;
  probability: number;
  expected_close_date: string | null;
  products_interested: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface OpportunityStats {
  total_count: number;
  total_pipeline_value: number;
  weighted_pipeline_value: number;
  stage_counts: Record<OpportunityStage, number>;
  stage_values: Record<OpportunityStage, number>;
}

// ========== 增长系统 — 主题集群 ==========

export type FunnelStage = "TOFU" | "MOFU" | "BOFU";
export type ContentIntent = "informational" | "commercial" | "transactional";
export type BriefContentType = "BuyingGuide" | "CaseStudy" | "FAQ" | "Comparison" | "TechnicalDoc" | "UseCasePage" | "QnA" | "KnowledgeBase" | "Checklist" | "Whitepaper" | "";

export interface ProblemMapItem {
  funnel: FunnelStage;
  persona: string;
  question: string;
  impact: string;
}

export interface DistributionChannel {
  name: string;
  type: "primary" | "secondary";
  content_types: BriefContentType[];
  description: string;
}

export interface TopicCluster {
  id: string;
  team_id: string;
  user_id: string;
  name: string;
  company_name: string;
  company_context: string;
  buyer_context: string;
  problem_map: ProblemMapItem[];
  distribution_channels: DistributionChannel[];
  status: string;
  created_at: string;
  updated_at: string;
  pillars?: ContentPillar[];
}

export interface ContentPillar {
  id: string;
  cluster_id: string;
  team_id: string;
  name: string;
  intent_type: string;
  description: string;
  questions: { funnel: FunnelStage; persona: string; question: string; impact: string }[];
  priority_personas: string[];
  primary_channels: string[];
  secondary_channels: string[];
  evidence_required: number;
  sort_order: number;
  status: string;
  created_at: string;
  updated_at: string;
  briefs?: ContentBrief[];
  evidence?: EvidenceItem[];
}

export interface ContentBrief {
  id: string;
  pillar_id: string;
  team_id: string;
  title: string;
  description: string;
  content_type: BriefContentType;
  funnel_stage: FunnelStage;
  intent: ContentIntent;
  target_persona: string;
  priority_question: string;
  evidence_count: number;
  primary_channel: string;
  secondary_channel: string;
  evidence_refs: { id: string; content: string }[];
  status: string;
  generated_content: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface EvidenceItem {
  id: string;
  pillar_id: string;
  team_id: string;
  content: string;
  source: string;
  source_type: string;
  created_at: string;
}
