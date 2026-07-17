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
    id: "answer-first",
    name: "答案优先 Answer-First",
    description: "为 AI 引擎优化的结构化内容，开篇直接回答核心问题，适合 SEO/AEO/GEO 全面优化",
    icon: "🎯",
    variables: [
      { key: "question", label: "核心问题", placeholder: "用户最关心的核心问题是什么？" },
      { key: "topic", label: "内容主题", placeholder: "如：B2B企业如何用AI提升获客效率" },
      { key: "target_audience", label: "目标读者", placeholder: "如：外贸企业主、销售总监" },
      { key: "key_points", label: "关键要点", placeholder: "必须涵盖的要点，用逗号分隔" },
    ],
    systemPrompt: `你是一位资深的内容策略师，专精于 AI 时代的内容优化（SEO/AEO/GEO 三位一体）。

你的写作遵循以下核心原则：
1. **答案优先 (Answer-First)**：开篇 100 字内直接回答核心问题，让读者和 AI 都能快速抓取关键信息
2. **清晰层级**：使用 H2/H3 标题构建逻辑清晰的模块化结构，每个 H2 解决一个子问题
3. **E-E-A-T 信号**：
   - 经验 (Experience)：用实际场景和案例说明
   - 专业 (Expertise)：展示深度行业知识和数据
   - 权威 (Authoritativeness)：引用可信来源和行业标准
   - 可信 (Trustworthiness)：用事实和数据支撑观点，避免夸大
4. **机器可读**：结构清晰，便于搜索引擎索引和 AI 引擎提取

输出格式要求：
- 用 Markdown 撰写
- H1 为文章主标题
- H2 为各板块标题
- 每个 H2 下包含一段"核心答案"（加粗），再展开细节
- 文末包含 FAQ 段落（3-5 个常见问题 + 简要回答）
- 包含一个"结论与行动建议"收尾`,
    userPromptTemplate: `请围绕以下内容撰写一篇「答案优先」结构的文章：

【核心问题】{{question}}
【内容主题】{{topic}}
【目标读者】{{target_audience}}
【关键要点】{{key_points}}
【语言】{{language}}

请生成一篇文章，严格遵循以下结构：

## 输出结构
1. **开篇答案** (100-150字)：直接回答核心问题，让读者立刻获得价值
2. **H2 分板块展开**：每个 H2 对应一个子问题或要点，先给核心答案再展开
3. **FAQ 段落**：3-5 个相关常见问题 + 简要回答
4. **结论与行动建议**：总结核心观点 + 可操作的下一步建议

## E-E-A-T 要求
- 至少包含 1 个实际应用场景或案例
- 引用行业数据或趋势
- 给出具体、可操作的建议（不要泛泛而谈）

用 {{language}} 撰写。`,
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
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] !== undefined ? vars[key] : `{{${key}}}`);
}
