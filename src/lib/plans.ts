import type { PlanInfo } from "@/types";

const PLANS: PlanInfo[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceLabel: "免费",
    limits: { maxMembers: 3, maxSites: 1, maxContent: 10, maxAIGenerations: 5 },
    features: ["14 天试用", "最多 3 名成员", "1 个独立站", "10 条内容", "每日 5 次 AI 生成", "基础分析"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    priceLabel: "$29/月",
    limits: { maxMembers: 10, maxSites: 10, maxContent: 100, maxAIGenerations: 50 },
    features: ["最多 10 名成员", "10 个独立站", "100 条内容", "每日 50 次 AI 生成", "高级分析", "CSV 导入导出", "API 访问"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 99,
    priceLabel: "$99/月",
    limits: { maxMembers: 999, maxSites: 999, maxContent: 999, maxAIGenerations: 999 },
    features: ["无限成员", "无限独立站", "无限内容", "无限 AI 生成", "专属客服", "自定义集成", "SSO 单点登录"],
  },
];

export function getAllPlans(): PlanInfo[] {
  return PLANS;
}

export function getPlan(planId: string): PlanInfo | undefined {
  return PLANS.find((p) => p.id === planId);
}

export function getPlanLimits(planId: string) {
  const plan = getPlan(planId);
  return plan?.limits || PLANS[0].limits;
}

export const TRIAL_DAYS = 14;
