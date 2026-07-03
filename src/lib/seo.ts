import { chat } from "@/lib/llm";

export interface KeywordResult {
  keyword: string;
  searchVolume: string;
  difficulty: string;
  intent: string;
  relevance: string;
}

export interface SEOAuditResult {
  overallScore: number;
  title: { score: number; issues: string[] };
  metaDescription: { score: number; issues: string[] };
  contentStructure: { score: number; issues: string[] };
  keywordUsage: { score: number; issues: string[] };
  readability: { score: number; issues: string[] };
  internalLinks: { score: number; issues: string[] };
  recommendations: string[];
}

// AI 关键词研究
export async function researchKeywords(
  topic: string,
  industry: string,
  language: string = "zh-CN"
): Promise<KeywordResult[]> {
  const prompt = `你是一个 SEO 关键词研究专家。请为以下主题研究关键词。

主题: ${topic}
行业: ${industry}
目标语言: ${language}
目标地区: ${language === "zh-CN" ? "中国" : language === "en" ? "全球/英语市场" : "全球"}

请返回 8-10 个推荐关键词，以 JSON 数组格式返回（不要包含其他文字）：
[
  {
    "keyword": "关键词",
    "searchVolume": "搜索量级别（高/中/低）",
    "difficulty": "竞争难度（高/中/低）",
    "intent": "搜索意图（信息型/商业型/交易型/导航型）",
    "relevance": "与主题相关度（高/中/低）"
  }
]

关键词要覆盖长尾词和核心词，考虑用户可能的不同搜索意图。`;

  const response = await chat([
    { role: "system", content: "你是一个 SEO 关键词研究专家。请严格按照 JSON 格式返回结果。" },
    { role: "user", content: prompt },
  ]);

  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

// SEO 综合审计
export async function auditSEO(
  content: string,
  title: string,
  description: string,
  keyword: string
): Promise<SEOAuditResult> {
  const prompt = `你是一个 SEO 审计专家。请分析以下内容并给出评分和改进建议。

## 页面信息
标题: ${title}
描述: ${description || "未设置"}
目标关键词: ${keyword}
正文内容（前1000字）: ${content.substring(0, 1000)}

请以 JSON 格式返回 SEO 审计报告（不要包含其他文字）：
{
  "overallScore": <0-100 整数>,
  "title": { "score": <0-100>, "issues": ["问题1", "问题2"] },
  "metaDescription": { "score": <0-100>, "issues": ["问题1"] },
  "contentStructure": { "score": <0-100>, "issues": ["问题1"] },
  "keywordUsage": { "score": <0-100>, "issues": ["问题1"] },
  "readability": { "score": <0-100>, "issues": ["问题1"] },
  "internalLinks": { "score": <0-100>, "issues": ["问题1"] },
  "recommendations": ["优先修复建议1", "建议2", "建议3"]
}

评分标准：
- 标题：长度 30-60 字符，包含关键词，有吸引力
- 描述：长度 120-160 字符，包含关键词，有 CTA
- 内容结构：有 H1/H2/H3 层级，段落长度适中（3-5 句）
- 关键词使用：密度 1-3%，自然分布，LSI 关键词
- 可读性：简洁明了，句子不过长，有项目符号
- 内链：有相关页面链接`;

  const response = await chat([
    { role: "system", content: "你是一个 SEO 审计专家。请严格按照 JSON 格式返回分析结果。" },
    { role: "user", content: prompt },
  ]);

  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      overallScore: 0,
      title: { score: 0, issues: ["分析失败"] },
      metaDescription: { score: 0, issues: ["分析失败"] },
      contentStructure: { score: 0, issues: ["分析失败"] },
      keywordUsage: { score: 0, issues: ["分析失败"] },
      readability: { score: 0, issues: ["分析失败"] },
      internalLinks: { score: 0, issues: ["分析失败"] },
      recommendations: ["SEO 分析暂时不可用，请稍后重试"],
    };
  }
}

// GEO：生成 hreflang 标签
export function generateHreflangTags(
  defaultLang: string,
  alternateLangs: { lang: string; url: string }[]
): string {
  const tags = [`<link rel="alternate" hreflang="${defaultLang}" href="${alternateLangs.find((a) => a.lang === defaultLang)?.url || '/'}" />`];
  for (const alt of alternateLangs) {
    if (alt.lang !== defaultLang) {
      tags.push(`<link rel="alternate" hreflang="${alt.lang}" href="${alt.url}" />`);
    }
  }
  tags.push(`<link rel="alternate" hreflang="x-default" href="${alternateLangs[0]?.url || '/'}" />`);
  return tags.join("\n");
}

// GEO：生成地区化结构化数据
export function generateLocalBusinessSchema(data: {
  name: string;
  description: string;
  url: string;
  region: string;
  language: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: data.name,
    description: data.description,
    url: data.url,
    areaServed: {
      "@type": "Country",
      name: data.region,
    },
    availableLanguage: data.language,
  };
}
