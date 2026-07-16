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

export interface AEOAuditResult {
  score: number;
  faq_schema: { generated: boolean; score: number; max: number };
  geo_version: { generated: boolean; score: number; max: number };
  faq_section: { found: boolean; suggestion: string };
  conclusion: { found: boolean; suggestion: string };
}

// AEO 内容详细分析（规则引擎，不依赖 AI）
export function analyzeAEO(content: string, title: string): AEOAuditResult {
  const contentLower = content.toLowerCase();
  const hasFAQSection = /(常见问题|FAQ|frequently.?asked|Q&A|问答)/i.test(content)
    || (content.match(/(?:^|\n)\s*(?:Q|问|问题)\s*[：:]/gm) || []).length >= 2;
  const hasConclusion = /(总结|结论|conclusion|summary|综上所述|归纳|wrap.?up)/i.test(title + content.substring(content.length - 500));
  const hasFAQSchema = false; // 默认未生成
  const hasGeo = false; // 默认未生成

  // 评分
  const faqSchemaScore = hasFAQSchema ? 15 : 0;
  const geoScore = hasGeo ? 10 : 0;
  const totalScore = faqSchemaScore + geoScore + (hasFAQSection ? 5 : 0) + (hasConclusion ? 5 : 0);

  return {
    score: Math.min(totalScore, 30),
    faq_schema: { generated: hasFAQSchema, score: faqSchemaScore, max: 15 },
    geo_version: { generated: hasGeo, score: geoScore, max: 10 },
    faq_section: {
      found: hasFAQSection,
      suggestion: hasFAQSection ? "" : "建议追加 FAQ 段落",
    },
    conclusion: {
      found: hasConclusion,
      suggestion: hasConclusion ? "" : "建议追加结论段",
    },
  };
}

// 提取或推测 meta 信息
export function extractMetaInfo(content: string, title: string, tags: string[]): {
  meta_title: string;
  meta_description: string;
  main_keyword: string;
  keyword_in_title: boolean;
  keyword_in_content: boolean;
  meta_title_score: number;
  meta_description_score: number;
  word_count_score: number;
  keyword_score: number;
  has_faq_section: boolean;
  has_conclusion: boolean;
} {
  const keyword = tags?.[0] || title.split(/[\s|｜-]/)[0] || "";
  const metaTitle = title;
  const metaDescription = content.replace(/[#*\n]/g, "").substring(0, 160).trim();
  const wordCount = content.length;

  // Meta Title 评分 (30-60 字符，满分 20)
  const titleLen = metaTitle.length;
  let metaTitleScore = 0;
  if (titleLen >= 30 && titleLen <= 60) metaTitleScore = 20;
  else if (titleLen >= 20 && titleLen <= 70) metaTitleScore = 12;
  else if (titleLen > 0) metaTitleScore = 5;

  // Meta Description 评分 (120-160 字符，满分 20)
  const descLen = metaDescription.length;
  let metaDescriptionScore = 0;
  if (descLen >= 120 && descLen <= 160) metaDescriptionScore = 20;
  else if (descLen >= 80 && descLen <= 200) metaDescriptionScore = 12;
  else if (descLen > 0) metaDescriptionScore = 5;

  // 字数评分 (≥1500 words ≈ 中文 1500 字，满分 20)
  let wordCountScore = 0;
  if (wordCount >= 1500) wordCountScore = 20;
  else if (wordCount >= 800) wordCountScore = 12;
  else if (wordCount >= 300) wordCountScore = 6;
  else wordCountScore = 0;

  // 关键词评分 (满分 15)
  const kw = keyword.toLowerCase();
  const inTitle = title.toLowerCase().includes(kw);
  const inContent = content.toLowerCase().includes(kw);
  let keywordScore = 0;
  if (inTitle && inContent) keywordScore = 15;
  else if (inContent) keywordScore = 8;
  else if (inTitle) keywordScore = 5;

  // 内容结构检测
  const hasFAQ = /(常见问题|FAQ|Q&A|问答)/i.test(content);
  const hasConclusion = /(总结|结论|conclusion|summary|综上所述)/i.test(title + content.substring(content.length - 500));

  return {
    meta_title: metaTitle,
    meta_description: metaDescription.substring(0, 160),
    main_keyword: keyword,
    keyword_in_title: inTitle,
    keyword_in_content: inContent,
    meta_title_score: metaTitleScore,
    meta_description_score: metaDescriptionScore,
    word_count_score: wordCountScore,
    keyword_score: keywordScore,
    has_faq_section: hasFAQ,
    has_conclusion: hasConclusion,
  };
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
