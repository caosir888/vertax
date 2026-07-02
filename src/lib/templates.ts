// Prompt 模板库 — AI 内容工坊

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  variables: { key: string; label: string; placeholder: string }[];
  systemPrompt: string;
  userPromptTemplate: string;
}

export const templates: Template[] = [
  {
    id: "product-intro",
    name: "产品介绍",
    description: "专业的产品/服务介绍文案，适合官网和宣传材料",
    icon: "📦",
    variables: [
      { key: "product_name", label: "产品名称", placeholder: "如：VertaX AI 获客平台" },
      { key: "product_description", label: "产品描述", placeholder: "简要描述产品功能和特色" },
      { key: "target_audience", label: "目标用户", placeholder: "如：B2B 外贸企业、跨境电商卖家" },
      { key: "tone", label: "文案风格", placeholder: "专业、轻松、热情……默认专业" },
    ],
    systemPrompt: `你是一位资深的产品营销文案专家。你擅长用简洁有力的语言突出产品卖点，让读者快速理解产品价值。`,
    userPromptTemplate: `请为以下产品撰写产品介绍文案，生成 3 个不同角度的版本：

【产品名称】{{product_name}}
【产品描述】{{product_description}}
【目标用户】{{target_audience}}
【文案风格】{{tone}}
【语言】{{language}}

要求：
- 版本1：突出产品核心功能和优势
- 版本2：从用户痛点和解决方案的角度切入
- 版本3：简洁有力的电梯演讲风格（30 秒能读完）
- 每个版本 150-300 字
- 用 {{language}} 撰写

请按以下格式输出：
---
版本1
<内容>
---
版本2
<内容>
---
版本3
<内容>`,
  },
  {
    id: "seo-article",
    name: "SEO 文章",
    description: "搜索引擎优化的长文内容，带标题建议和关键词布局",
    icon: "📝",
    variables: [
      { key: "topic", label: "文章主题", placeholder: "如：2025年B2B获客的5大趋势" },
      { key: "keywords", label: "核心关键词", placeholder: "如：B2B获客、AI销售、外贸开发" },
      { key: "target_audience", label: "目标读者", placeholder: "如：外贸企业主、销售总监" },
      { key: "tone", label: "文章风格", placeholder: "专业深度、通俗易懂……默认专业" },
    ],
    systemPrompt: `你是一位资深的 SEO 内容策略师和撰稿人。你擅长撰写既有深度又易于阅读的长文内容，能够自然地融入关键词，提升搜索引擎排名。`,
    userPromptTemplate: `请围绕以下主题撰写一篇 SEO 优化的文章，生成 3 个不同角度的版本：

【文章主题】{{topic}}
【核心关键词】{{keywords}}
【目标读者】{{target_audience}}
【文章风格】{{tone}}
【语言】{{language}}

要求：
- 版本1：深度分析型（行业洞察 + 数据 + 趋势）
- 版本2：实用指南型（步骤 + 方法 + 可操作建议）
- 版本3：案例故事型（以真实场景引入 + 解决方案）
- 每个版本 800-1200 字
- 包含标题建议（H1 + 3个H2小标题）
- 关键词自然融入，不要堆砌
- 用 {{language}} 撰写

请按以下格式输出：
---
版本1
【建议标题】...
<内容>
---
版本2
【建议标题】...
<内容>
---
版本3
【建议标题】...
<内容>`,
  },
  {
    id: "social-media",
    name: "社交媒体文案",
    description: "适合 LinkedIn、Twitter、微信等平台的短文案",
    icon: "📱",
    variables: [
      { key: "topic", label: "帖子主题", placeholder: "如：我们新产品上线了" },
      { key: "key_message", label: "核心信息", placeholder: "一句话说明你想传达什么" },
      { key: "platform", label: "目标平台", placeholder: "LinkedIn / Twitter / 微信 / 通用" },
      { key: "tone", label: "文案风格", placeholder: "正式、轻松、幽默……默认轻松专业" },
    ],
    systemPrompt: `你是一位社交媒体运营专家。你擅长根据不同平台的特性撰写高互动率的文案，善于用简短有力的语言抓住读者注意力。`,
    userPromptTemplate: `请为以下内容撰写社交媒体文案，生成 3 个不同风格的版本：

【帖子主题】{{topic}}
【核心信息】{{key_message}}
【目标平台】{{platform}}
【文案风格】{{tone}}
【语言】{{language}}

要求：
- 版本1：专业权威型（数据/观点/行业洞察）
- 版本2：互动讨论型（提问/引发思考/邀请评论）
- 版本3：故事叙事型（简短场景/用户故事/幕后花絮）
- 每个版本 100-250 字
- 适配 {{platform}} 平台的文案风格
- 包含合适的 emoji 和 hashtag 建议
- 用 {{language}} 撰写

请按以下格式输出：
---
版本1
<内容>
#hashtag1 #hashtag2
---
版本2
<内容>
#hashtag1 #hashtag2
---
版本3
<内容>
#hashtag1 #hashtag2`,
  },
  {
    id: "cold-email",
    name: "邮件开发信",
    description: "B2B 冷启动邮件模板，提高回复率的开发信",
    icon: "✉️",
    variables: [
      { key: "sender_company", label: "发件公司", placeholder: "如：VertaX" },
      { key: "value_proposition", label: "价值主张", placeholder: "你能为对方提供什么价值" },
      { key: "target_audience", label: "目标收件人", placeholder: "如：外贸公司销售总监" },
      { key: "call_to_action", label: "行动号召", placeholder: "如：预约一次15分钟的产品演示" },
    ],
    systemPrompt: `你是一位 B2B 邮件营销专家。你擅长撰写高回复率的冷启动邮件，了解如何用简洁精准的语言引起收件人兴趣，推动下一步行动。`,
    userPromptTemplate: `请撰写一封 B2B 邮件开发信，生成 3 个不同风格的版本：

【发件公司】{{sender_company}}
【价值主张】{{value_proposition}}
【目标收件人】{{target_audience}}
【行动号召】{{call_to_action}}
【语言】{{language}}

要求：
- 版本1：价值导向型（开门见山讲价值）
- 版本2：问题导向型（从对方可能遇到的痛点切入）
- 版本3：社交证明型（引用客户案例或数据建立信任）
- 包含：主题行 + 正文 + 签名
- 正文 100-200 字，不要长篇大论
- 语气真诚、个性化，避免模板化的推销腔调
- 用 {{language}} 撰写

请按以下格式输出：
---
版本1
【主题】...
<正文>
---
版本2
【主题】...
<正文>
---
版本3
【主题】...
<正文>`,
  },
];

export const languages: { code: string; name: string }[] = [
  { code: "zh-CN", name: "中文" },
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
];

export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`);
}
