// B2B 独立站模板
export interface SiteTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  pages: string[]; // 页面列表
  primaryColor: string;
}

export interface SiteSettings {
  companyName: string;
  tagline: string;
  logoUrl: string;
  primaryColor: string;
  industry: string;
  products: string;
  aboutUs: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
}

export const siteTemplates: SiteTemplate[] = [
  {
    id: "classic-b2b",
    name: "经典 B2B 企业站",
    icon: "🏢",
    description: "产品展示为主，适合制造/贸易企业。首页 → 产品 → 关于我们 → 联系方式",
    pages: ["首页", "产品展示", "关于我们", "联系方式"],
    primaryColor: "#1e3a5f",
  },
  {
    id: "modern-saas",
    name: "现代 SaaS 官网",
    icon: "🚀",
    description: "简洁科技风格，适合软件/技术服务企业。首页 → 功能 → 定价 → 关于 → 联系",
    pages: ["首页", "功能介绍", "定价方案", "关于我们", "联系我们"],
    primaryColor: "#6366f1",
  },
  {
    id: "minimal-consulting",
    name: "极简咨询服务站",
    icon: "✨",
    description: "轻量专业风格，适合咨询/服务机构。首页 → 服务 → 案例 → 联系",
    pages: ["首页", "服务内容", "成功案例", "联系我们"],
    primaryColor: "#0f766e",
  },
];

export function buildSitePrompt(template: SiteTemplate, settings: SiteSettings) {
  const pageList = template.pages.map((p, i) => `${i + 1}. ${p}`).join("\n");

  return `你是一个专业的 B2B 网站内容策划师。请为以下企业生成独立站各页面的完整文案。

**企业信息：**
- 公司名称：${settings.companyName}
- 标语：${settings.tagline}
- 行业：${settings.industry}
- 产品/服务：${settings.products}
- 公司简介：${settings.aboutUs}
- 联系方式：${settings.contactEmail} / ${settings.contactPhone} / ${settings.contactAddress}

**网站类型：** ${template.name}
**需要生成的页面：**
${pageList}

**要求：**
1. 每个页面生成150-300字的专业英文文案（用于国际B2B官网）
2. 文案要有营销感，突出企业优势
3. 包含合适的标题、副标题、正文段落
4. CTA（行动号召）清晰

请按以下格式输出（每个页面用 ===页面名=== 分隔）：

===首页===
# 标题
## 副标题
正文内容...
[CTA: 具体按钮文字]

===产品展示===
# 标题
...

依次生成所有页面。`
}

export function parseSiteContent(text: string): { title: string; slug: string; content: string }[] {
  const pages: { title: string; slug: string; content: string }[] = [];
  const sections = text.split(/===(.+?)===/);

  for (let i = 1; i < sections.length; i += 2) {
    const title = sections[i].trim();
    const content = (sections[i + 1] || "").trim();
    const slug = title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    pages.push({ title, slug, content });
  }

  return pages;
}

export function renderSiteHTML(
  template: SiteTemplate,
  pages: { title: string; slug: string; content: string }[],
  settings: SiteSettings
): string {
  const navLinks = pages
    .map((p) => `<a href="/${p.slug}" class="nav-link">${p.title}</a>`)
    .join("\n");

  const pageHTML = pages
    .map(
      (p) => `
  <section id="${p.slug}" class="page-section">
    <div class="container">
      ${markdownToHTML(p.content)}
    </div>
  </section>`
    )
    .join("\n");

  const pageTitle = settings.seoTitle || `${settings.companyName} - ${settings.tagline}`;
  const metaDesc = settings.seoDescription || `${settings.companyName} — ${settings.tagline}. ${settings.industry ? `${settings.industry}行业的专业B2B解决方案提供商。` : ""}`;
  const ogImage = settings.ogImage || "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <meta name="description" content="${metaDesc}">
  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="${metaDesc}">
  <meta property="og:type" content="website">
  ${ogImage ? `<meta property="og:image" content="${ogImage}">` : ""}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${pageTitle}">
  <meta name="twitter:description" content="${metaDesc}">
  <style>
    :root { --primary: ${settings.primaryColor}; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; line-height: 1.6; }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
    header { background: white; border-bottom: 1px solid #e5e5e5; position: sticky; top: 0; z-index: 100; }
    header .container { display: flex; align-items: center; justify-content: space-between; padding-top: 16px; padding-bottom: 16px; }
    .logo { font-size: 1.25rem; font-weight: 700; color: var(--primary); }
    nav { display: flex; gap: 24px; }
    .nav-link { color: #666; text-decoration: none; font-size: 0.875rem; font-weight: 500; }
    .nav-link:hover { color: var(--primary); }
    .page-section { padding: 80px 0; }
    .page-section:nth-child(even) { background: #f9fafb; }
    h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5em; color: #111; }
    h2 { font-size: 1.5rem; font-weight: 600; margin: 1em 0 0.5em; color: #333; }
    h3 { font-size: 1.125rem; font-weight: 600; margin: 0.75em 0 0.5em; }
    p { margin-bottom: 1em; color: #555; }
    .cta { display: inline-block; background: var(--primary); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
    .cta:hover { opacity: 0.9; }
    .hero { text-align: center; padding: 120px 0; background: linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 70%, white)); color: white; }
    .hero h1, .hero h2, .hero p { color: white; }
    footer { background: #111; color: #999; padding: 48px 0; text-align: center; font-size: 0.875rem; }
    footer p { color: #999; }
    @media (max-width: 768px) {
      nav { display: none; }
      h1 { font-size: 1.75rem; }
      .page-section { padding: 48px 0; }
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <div class="logo">${settings.companyName}</div>
      <nav>${navLinks}</nav>
    </div>
  </header>
  ${pageHTML}
  <footer>
    <div class="container">
      <p>&copy; ${new Date().getFullYear()} ${settings.companyName}. All rights reserved.</p>
      <p>${settings.contactEmail} | ${settings.contactPhone}</p>
    </div>
  </footer>
</body>
</html>`;
}

function markdownToHTML(md: string): string {
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\[CTA:\s*(.+?)\]/g, '<a href="#contact" class="cta">$1</a>')
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hli\/])(.+)$/gm, "<p>$1</p>");
}
