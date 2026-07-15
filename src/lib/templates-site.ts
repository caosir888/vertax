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
  enableChat?: boolean;
  chatWelcomeMessage?: string;
  customDomain?: string;
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
  {
    id: "spiritual-ecommerce",
    name: "灵性电商站",
    icon: "🔮",
    description: "水晶/灵性产品电商风格。首页展示产品、心愿系列、客户好评、信任徽章",
    pages: ["首页", "产品目录", "品牌故事", "联系我们"],
    primaryColor: "#1A1A2E",
  },
];

export function buildSitePrompt(template: SiteTemplate, settings: SiteSettings, knowledgeContext?: string) {
  const pageList = template.pages.map((p, i) => `${i + 1}. ${p}`).join("\n");

  const knowledgeSection = knowledgeContext
    ? `\n**知识库参考资料（来自团队上传的文档）：**\n${knowledgeContext.slice(0, 3000)}\n\n请尽可能参考以上资料中的产品名称、技术参数、公司背景等真实信息来撰写文案。\n`
    : "";

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

${knowledgeSection}
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

export function buildEcommercePrompt(template: SiteTemplate, settings: SiteSettings, knowledgeContext?: string) {
  const pageList = template.pages.map((p, i) => `${i + 1}. ${p}`).join("\n");

  const knowledgeSection = knowledgeContext
    ? `\n**知识库参考资料（来自团队上传的产品文档）：**\n${knowledgeContext.slice(0, 3000)}\n\n请尽可能参考以上资料中的产品名称、材质、价格、寓意等真实信息来撰写文案。\n`
    : "";

  return `你是一个灵性珠宝/水晶电商品牌的内容策划师。请为以下品牌生成独立站各页面的完整文案，风格参考 Buddha & Karma。

**品牌信息：**
- 品牌名称：${settings.companyName}
- 标语：${settings.tagline}
- 行业：${settings.industry}
- 产品/服务：${settings.products}
- 品牌故事：${settings.aboutUs}
- 联系方式：${settings.contactEmail} / ${settings.contactPhone} / ${settings.contactAddress}

**网站类型：** ${template.name}
**需要生成的页面：**
${pageList}

${knowledgeSection}
**要求：**
1. 用英文撰写（面向国际市场），语气温暖、治愈、有灵性
2. 强调产品的情感价值和精神寓意（爱、保护、财富、治愈、平静）
3. 首页要有品牌故事和核心价值主张
4. CTA 清晰有力

**重要：产品目录页的特殊格式要求**

在"产品目录"页面中，请按以下格式输出结构化产品数据：

===产品目录===
# Our Collection
## Featured Products

<!--vertax-product-->
name: 产品名称（例如：Rose Quartz Love Bracelet）
price: $XX.00
badge: Bestseller 或 New 或留空
description: 1-2句产品描述，包含材质、寓意
intention: Love（选填：Love/Protection/Wealth/Healing/Peace/Luck）
<!--/vertax-product-->

（输出 5-8 个产品，每个产品用上面的标记包裹）

<!--vertax-collections-->
Love: Rose Quartz, Amethyst | 爱与关系系列，帮助打开心轮
Protection: Black Tourmaline, Obsidian | 保护与净化系列，抵御负能量
Wealth: Citrine, Pyrite, Jade | 财富与丰盛系列，吸引富足
Healing: Clear Quartz, Selenite | 治愈与平衡系列，恢复身心和谐
<!--/vertax-collections-->

<!--vertax-testimonials-->
Sarah M.: "This bracelet brought so much peace to my daily life. The quality is amazing!" ★★★★★
Michael K.: "Bought the protection set for my family. We all feel the positive energy." ★★★★★
Emma L.: "Beautiful craftsmanship. I wear my rose quartz bracelet every day." ★★★★★
David R.: "The wealth bracelet arrived quickly and the packaging was gorgeous." ★★★★★
Lisa T.: "Gave these as gifts and everyone loved them. Will order more!" ★★★★★
<!--/vertax-testimonials-->

**其他页面正常格式：**
===首页===
# 标题
## 副标题
正文内容...
[CTA: 具体按钮文字]

===品牌故事===
...

===联系我们===
...

请确保产品目录页严格遵循上面的标记格式，其他页面正常输出。`
}

export function parseProducts(content: string): { name: string; price: string; badge: string; description: string; intention: string }[] {
  const products: { name: string; price: string; badge: string; description: string; intention: string }[] = [];
  const regex = /<!--vertax-product-->([\s\S]*?)<!--\/vertax-product-->/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const block = match[1];
    const get = (key: string) => {
      const m = block.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
      return m ? m[1].trim() : "";
    };
    products.push({
      name: get("name"),
      price: get("price"),
      badge: get("badge"),
      description: get("description"),
      intention: get("intention"),
    });
  }
  return products;
}

export function parseCollections(content: string): { name: string; products: string; description: string }[] {
  const collections: { name: string; products: string; description: string }[] = [];
  const regex = /<!--vertax-collections-->([\s\S]*?)<!--\/vertax-collections-->/;
  const match = content.match(regex);
  if (!match) return collections;
  const lines = match[1].trim().split("\n").filter(Boolean);
  for (const line of lines) {
    const parts = line.split("|").map(s => s.trim());
    if (parts.length >= 2) {
      const [nameAndProducts, description] = [parts[0], parts.slice(1).join(" | ")];
      const colonIdx = nameAndProducts.indexOf(":");
      if (colonIdx > 0) {
        collections.push({
          name: nameAndProducts.slice(0, colonIdx).trim(),
          products: nameAndProducts.slice(colonIdx + 1).trim(),
          description,
        });
      }
    }
  }
  return collections;
}

export function parseTestimonials(content: string): { name: string; quote: string; stars: string }[] {
  const testimonials: { name: string; quote: string; stars: string }[] = [];
  const regex = /<!--vertax-testimonials-->([\s\S]*?)<!--\/vertax-testimonials-->/;
  const match = content.match(regex);
  if (!match) return testimonials;
  const lines = match[1].trim().split("\n").filter(Boolean);
  for (const line of lines) {
    const starMatch = line.match(/([★☆]+)/);
    const stars = starMatch ? starMatch[1] : "★★★★★";
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      testimonials.push({
        name: line.slice(0, colonIdx).trim(),
        quote: line.slice(colonIdx + 1).replace(/[★☆]+/g, "").trim().replace(/^"|"$/g, ""),
        stars,
      });
    }
  }
  return testimonials;
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
      .replace(/[^a-z0-9一-鿿-]/g, "")
      .replace(/--+/g, "-")
      .replace(/^-|-$/g, "")
      || `page-${i}`;

    pages.push({ title, slug, content });
  }

  return pages;
}

function renderEcommerceHTML(
  _template: SiteTemplate,
  pages: { title: string; slug: string; content: string }[],
  settings: SiteSettings,
  siteId?: string
): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const pageTitle = esc(settings.seoTitle || `${settings.companyName} - ${settings.tagline}`);
  const metaDesc = esc(settings.seoDescription || `${settings.companyName} — ${settings.tagline}. ${settings.industry ? `${settings.industry}行业的水晶与灵性珠宝。` : ""}`);
  const ogImage = settings.ogImage || "";
  const canonicalUrl = settings.customDomain ? `https://${settings.customDomain}` : (siteId ? `/api/sites/${siteId}/preview` : "");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.companyName,
    description: metaDesc,
    url: canonicalUrl,
    ...(settings.contactEmail ? { email: settings.contactEmail } : {}),
    ...(settings.contactPhone ? { telephone: settings.contactPhone } : {}),
  };

  const productPage = pages.find(p => p.title === "产品目录" || p.slug.includes("chan-pin")) || pages.find(p => p.slug.includes("product")) || pages[1] || pages[pages.length - 1];
  const productContent = productPage?.content || "";
  const products = parseProducts(productContent);
  const collections = parseCollections(productContent);
  const testimonials = parseTestimonials(productContent);

  const navLinks = pages.map(p => `<a href="#${p.slug}" class="nav-link">${p.title}</a>`).join("\n");

  const intentionIcons: Record<string, string> = { Love: "💕", Protection: "🛡️", Wealth: "💰", Healing: "💚", Peace: "☮️", Luck: "🍀" };
  const pageHTML = pages.map(p => {
    if (p.title === "产品目录" && products.length > 0) return "";
    return `<section id="${p.slug}" class="page-section"><div class="container">${markdownToHTML(p.content)}</div></section>`;
  }).filter(Boolean).join("\n");

  const productCards = products.map(p => {
    const icon = intentionIcons[p.intention] || "💎";
    const badgeColor = p.badge === "Bestseller" ? "#D72C0D" : p.badge === "New" ? "#13A165" : "transparent";
    return `<div class="product-card">
      <div class="product-img"><span>${icon}</span></div>
      ${p.badge ? `<span class="product-badge" style="background:${badgeColor}">${p.badge}</span>` : ""}
      <h3 class="product-name">${esc(p.name)}</h3>
      <p class="product-price">${esc(p.price)}</p>
      <p class="product-desc">${esc(p.description)}</p>
      ${p.intention ? `<span class="product-intention">${icon} ${esc(p.intention)}</span>` : ""}
    </div>`;
  }).join("\n");

  const collectionCards = collections.map(c => {
    const icon = intentionIcons[c.name] || "✨";
    return `<div class="collection-card">
      <div class="collection-icon">${icon}</div>
      <h3>${esc(c.name)}</h3>
      <p class="collection-products">${esc(c.products)}</p>
      <p>${esc(c.description)}</p>
    </div>`;
  }).join("\n");

  const testimonialCards = testimonials.map(t => `<div class="testimonial-card">
    <div class="testimonial-stars">${esc(t.stars)}</div>
    <p class="testimonial-quote">"${esc(t.quote)}"</p>
    <p class="testimonial-name">— ${esc(t.name)}</p>
  </div>`).join("\n");

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
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <style>
    :root { --dark: #1A1A2E; --gold: #ab8c52; --cream: #F2EFE7; --red: #D72C0D; --green: #13A165; --gray: #5E5E5E; --light: #f9fafb; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; line-height: 1.6; background: #fff; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

    /* Announcement bar */
    .announcement { background: var(--dark); color: #fff; text-align: center; padding: 10px 16px; font-size: 0.8125rem; letter-spacing: 0.02em; }

    /* Header */
    header { background: #fff; border-bottom: 1px solid #eee; position: sticky; top: 0; z-index: 100; }
    header .container { display: flex; align-items: center; justify-content: space-between; padding-top: 16px; padding-bottom: 16px; }
    .logo { font-size: 1.375rem; font-weight: 700; color: var(--dark); letter-spacing: 0.02em; }
    nav { display: flex; gap: 28px; align-items: center; }
    .nav-link { color: var(--gray); text-decoration: none; font-size: 0.8125rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; transition: color 0.15s; }
    .nav-link:hover { color: var(--dark); }
    .nav-inquiry-btn { background: var(--dark); color: #fff; border: none; padding: 10px 22px; border-radius: 6px; font-size: 0.8125rem; font-weight: 600; cursor: pointer; font-family: inherit; text-transform: uppercase; letter-spacing: 0.04em; transition: opacity 0.15s; white-space: nowrap; }
    .nav-inquiry-btn:hover { opacity: 0.85; }

    /* Hero */
    .hero { background: var(--cream); text-align: center; padding: 100px 24px 80px; }
    .hero h1 { font-size: 3rem; font-weight: 300; color: var(--dark); letter-spacing: 0.04em; margin-bottom: 16px; }
    .hero p { font-size: 1.125rem; color: var(--gray); max-width: 600px; margin: 0 auto 32px; }
    .btn-primary { display: inline-block; background: var(--dark); color: #fff; padding: 14px 36px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.06em; transition: opacity 0.15s; border: none; cursor: pointer; font-family: inherit; }
    .btn-primary:hover { opacity: 0.85; }
    .btn-gold { background: var(--gold); }

    /* Product grid */
    .section-title { text-align: center; font-size: 1.75rem; font-weight: 300; color: var(--dark); letter-spacing: 0.04em; margin-bottom: 8px; }
    .section-subtitle { text-align: center; color: var(--gray); margin-bottom: 48px; font-size: 0.9375rem; }
    .product-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; padding: 0 24px; max-width: 1200px; margin: 0 auto; }
    .product-card { position: relative; text-align: center; }
    .product-img { aspect-ratio: 1; background: var(--cream); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 3rem; margin-bottom: 12px; }
    .product-badge { position: absolute; top: 12px; left: 12px; color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .product-name { font-size: 0.9375rem; font-weight: 600; color: var(--dark); margin-bottom: 4px; }
    .product-price { font-size: 0.9375rem; font-weight: 500; color: var(--gold); margin-bottom: 8px; }
    .product-desc { font-size: 0.8125rem; color: var(--gray); line-height: 1.5; }
    .product-intention { display: inline-block; margin-top: 8px; font-size: 0.75rem; color: var(--gold); font-weight: 600; }

    /* Collections */
    .collections-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    .collection-card { background: #fff; border: 1px solid #eee; border-radius: 10px; padding: 32px; text-align: center; transition: box-shadow 0.2s; }
    .collection-card:hover { box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .collection-icon { font-size: 2.5rem; margin-bottom: 12px; }
    .collection-card h3 { font-size: 1.125rem; font-weight: 600; color: var(--dark); margin-bottom: 6px; }
    .collection-products { color: var(--gold); font-size: 0.875rem; font-weight: 500; margin-bottom: 8px; }
    .collection-card p { font-size: 0.875rem; color: var(--gray); }

    /* Testimonials */
    .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    .testimonial-card { background: var(--light); border-radius: 10px; padding: 28px; }
    .testimonial-stars { color: var(--gold); font-size: 1rem; margin-bottom: 12px; letter-spacing: 2px; }
    .testimonial-quote { font-size: 0.9375rem; color: #333; font-style: italic; line-height: 1.6; margin-bottom: 12px; }
    .testimonial-name { font-size: 0.8125rem; color: var(--gray); font-weight: 600; }

    /* Trust badges */
    .trust-section { background: var(--dark); padding: 60px 24px; }
    .trust-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; max-width: 1000px; margin: 0 auto; text-align: center; }
    .trust-item h3 { font-size: 2rem; font-weight: 300; color: var(--gold); margin-bottom: 4px; }
    .trust-item p { font-size: 0.8125rem; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.06em; }

    /* Why us */
    .why-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; max-width: 1000px; margin: 0 auto; text-align: center; }
    .why-item .why-icon { font-size: 2.5rem; margin-bottom: 16px; }
    .why-item h3 { font-size: 1.0625rem; font-weight: 600; color: var(--dark); margin-bottom: 8px; }
    .why-item p { font-size: 0.875rem; color: var(--gray); }

    /* Newsletter */
    .newsletter { background: var(--cream); text-align: center; padding: 72px 24px; }
    .newsletter h2 { font-size: 1.75rem; font-weight: 300; color: var(--dark); margin-bottom: 8px; }
    .newsletter p { color: var(--gray); margin-bottom: 24px; }
    .newsletter-form { display: flex; gap: 12px; max-width: 440px; margin: 0 auto; }
    .newsletter-form input { flex: 1; padding: 12px 16px; border: 1px solid #ddd; border-radius: 6px; font-size: 0.875rem; outline: none; font-family: inherit; }
    .newsletter-form input:focus { border-color: var(--dark); }
    .newsletter-form button { background: var(--dark); color: #fff; border: none; padding: 12px 28px; border-radius: 6px; font-size: 0.8125rem; font-weight: 600; cursor: pointer; text-transform: uppercase; letter-spacing: 0.04em; font-family: inherit; white-space: nowrap; }

    /* Page sections */
    .page-section { padding: 80px 24px; }
    .page-section:nth-child(even) { background: var(--light); }
    .page-section h1 { font-size: 2rem; font-weight: 300; color: var(--dark); margin-bottom: 0.5em; text-align: center; }
    .page-section h2 { font-size: 1.25rem; font-weight: 600; margin: 1em 0 0.5em; color: var(--dark); }
    .page-section p { margin-bottom: 1em; color: var(--gray); max-width: 720px; margin-left: auto; margin-right: auto; }

    /* Contact */
    .contact-section { background: var(--light); padding: 80px 24px; }
    .contact-form { max-width: 520px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
    .contact-form input, .contact-form textarea { width: 100%; padding: 12px 16px; border: 1px solid #ddd; border-radius: 6px; font-size: 0.9375rem; outline: none; font-family: inherit; }
    .contact-form input:focus, .contact-form textarea:focus { border-color: var(--dark); }
    .contact-form textarea { min-height: 120px; resize: vertical; }
    .contact-form button { background: var(--dark); color: #fff; border: none; padding: 14px 32px; border-radius: 6px; font-size: 0.875rem; font-weight: 600; cursor: pointer; text-transform: uppercase; letter-spacing: 0.04em; font-family: inherit; }
    .contact-form button:hover { opacity: 0.85; }
    .contact-form button:disabled { opacity: 0.6; cursor: not-allowed; }
    .contact-msg { text-align: center; font-size: 0.875rem; margin-top: 8px; }
    .contact-info { text-align: center; margin-top: 32px; color: #888; font-size: 0.875rem; }

    /* CTA */
    .cta { display: inline-block; background: var(--dark); color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; }
    .cta:hover { opacity: 0.9; }

    /* Footer */
    footer { background: var(--dark); color: rgba(255,255,255,0.6); padding: 56px 24px 32px; }
    .footer-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; max-width: 1000px; margin: 0 auto 40px; }
    .footer-col h3 { color: #fff; font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px; }
    .footer-col a, .footer-col p { display: block; color: rgba(255,255,255,0.5); text-decoration: none; font-size: 0.8125rem; margin-bottom: 8px; transition: color 0.15s; }
    .footer-col a:hover { color: #fff; }
    .footer-bottom { text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px; font-size: 0.75rem; }

    h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5em; color: #111; }
    h2 { font-size: 1.5rem; font-weight: 600; margin: 1em 0 0.5em; color: #333; }
    h3 { font-size: 1.125rem; font-weight: 600; margin: 0.75em 0 0.5em; }

    @media (max-width: 1024px) { .product-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 768px) {
      nav { display: none; }
      .hero h1 { font-size: 2rem; }
      .product-grid { grid-template-columns: repeat(2, 1fr); }
      .collections-grid { grid-template-columns: 1fr; }
      .testimonials-grid { grid-template-columns: 1fr; }
      .trust-grid { grid-template-columns: repeat(2, 1fr); }
      .why-grid { grid-template-columns: 1fr; }
      .footer-grid { grid-template-columns: repeat(2, 1fr); }
      .newsletter-form { flex-direction: column; }
    }
    @media (max-width: 480px) {
      .product-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
    }

    /* Inquiry Desk modal overlay */
    ${/* chatWidgetHTML provides its own <style>, so we just scope it */ ""}
    .vertax-overlay { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  </style>
</head>
<body>
  <div class="announcement">${esc(settings.tagline || "Free shipping on orders over $50 · 100% Happiness Guarantee")}</div>
  <header>
    <div class="container">
      <div class="logo">${esc(settings.companyName)}</div>
      <nav>
        ${navLinks}
        ${settings.enableChat && siteId ? `<button class="nav-inquiry-btn" onclick="document.getElementById('vertax-chat-overlay').classList.add('open');document.body.style.overflow='hidden'">Inquiry Desk</button>` : ""}
      </nav>
    </div>
  </header>

  <section class="hero">
    <h1>${esc(settings.tagline || "Style + Meaning")}</h1>
    <p>${esc(settings.aboutUs || "Handcrafted spiritual jewelry made with genuine crystals and gemstones. Each piece is infused with intention to bring peace, protection, and positive energy to your life.")}</p>
    <a href="#contact" class="btn-primary">Shop with Intention</a>
  </section>

  ${products.length > 0 ? `
  <section style="padding: 80px 0;">
    <h2 class="section-title">Bestsellers</h2>
    <p class="section-subtitle">Our most loved pieces, chosen for their beauty and energy</p>
    <div class="product-grid">${productCards}</div>
  </section>` : ""}

  ${collections.length > 0 ? `
  <section style="padding: 80px 0; background: var(--light);">
    <h2 class="section-title">Shop by Intention</h2>
    <p class="section-subtitle">Find the perfect piece for your spiritual journey</p>
    <div class="collections-grid">${collectionCards}</div>
  </section>` : ""}

  ${pageHTML}

  ${testimonials.length > 0 ? `
  <section style="padding: 80px 0;">
    <h2 class="section-title">What Our Customers Say</h2>
    <p class="section-subtitle">Join 50,000+ happy souls</p>
    <div class="testimonials-grid">${testimonialCards}</div>
  </section>` : ""}

  <section style="padding: 80px 0; background: var(--light);">
    <div class="container">
      <h2 class="section-title">Why ${esc(settings.companyName)}</h2>
      <p class="section-subtitle">What makes us different</p>
      <div class="why-grid">
        <div class="why-item">
          <div class="why-icon">✨</div>
          <h3>Energy Aligned</h3>
          <p>Every piece is cleansed and charged with Reiki energy before shipping, amplifying its natural properties.</p>
        </div>
        <div class="why-item">
          <div class="why-icon">💎</div>
          <h3>Genuine Crystals</h3>
          <p>We source only authentic, high-quality gemstones — never synthetic or imitation materials.</p>
        </div>
        <div class="why-item">
          <div class="why-icon">🌍</div>
          <h3>Worn With Purpose</h3>
          <p>Each piece carries meaning. Style that connects you to your intentions every day.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="trust-section">
    <div class="trust-grid">
      <div class="trust-item"><h3>50,000+</h3><p>Happy Customers</p></div>
      <div class="trust-item"><h3>4.85 ★</h3><p>1,500+ Reviews</p></div>
      <div class="trust-item"><h3>100%</h3><p>Happiness Guarantee</p></div>
      <div class="trust-item"><h3>Lifetime</h3><p>Quality Warranty</p></div>
    </div>
  </section>

  <section class="newsletter">
    <h2>Join Our Community</h2>
    <p>Get 10% off your first order and receive spiritual inspiration in your inbox.</p>
    <div class="newsletter-form">
      <input type="email" placeholder="Enter your email" />
      <button>Subscribe</button>
    </div>
  </section>

  <section id="contact" class="contact-section">
    <div class="container">
      <h2 class="section-title">Contact Us</h2>
      <p class="section-subtitle">Have questions? We'd love to hear from you.</p>
      <form id="vertax-contact-form" class="contact-form" onsubmit="return false;">
        <input type="text" name="name" placeholder="Your Name" required />
        <input type="email" name="email" placeholder="Your Email" required />
        <textarea name="message" placeholder="How can we help you?" required></textarea>
        <button type="submit" id="vertax-contact-btn">Send Message</button>
        <p id="vertax-contact-msg" class="contact-msg"></p>
      </form>
      <div class="contact-info">
        ${settings.contactEmail ? `<p>${esc(settings.contactEmail)}</p>` : ""}
        ${settings.contactPhone ? `<p>${esc(settings.contactPhone)}</p>` : ""}
        ${settings.contactAddress ? `<p>${esc(settings.contactAddress)}</p>` : ""}
      </div>
    </div>
  </section>

  ${siteId ? `<script>
(function() {
  var form = document.getElementById("vertax-contact-form");
  var btn = document.getElementById("vertax-contact-btn");
  var msg = document.getElementById("vertax-contact-msg");
  form.addEventListener("submit", async function(e) {
    e.preventDefault();
    var name = form.name.value.trim();
    var email = form.email.value.trim();
    var message = form.message.value.trim();
    if (!name || !email || !message) return;
    btn.disabled = true; btn.textContent = "Sending..."; msg.textContent = ""; msg.style.color = "";
    try {
      var resp = await fetch("/api/sites/${siteId}/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name, email: email, message: message }) });
      var json = await resp.json();
      if (resp.ok) { msg.textContent = "Message sent! We'll get back to you soon."; msg.style.color = "#13A165"; form.reset(); }
      else { msg.textContent = json.error || "Failed to send. Please try again."; msg.style.color = "#D72C0D"; }
    } catch (err) { msg.textContent = "Network error. Please try again."; msg.style.color = "#D72C0D"; }
    btn.disabled = false; btn.textContent = "Send Message";
  });
})();
</script>` : ""}

  <footer>
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col">
          <h3>Shop</h3>
          ${pages.map(p => `<a href="#${p.slug}">${esc(p.title)}</a>`).join("\n")}
        </div>
        <div class="footer-col">
          <h3>About</h3>
          <a href="#contact">Contact</a>
          <a href="#">Shipping & Returns</a>
          <a href="#">FAQ</a>
        </div>
        <div class="footer-col">
          <h3>Connect</h3>
          ${settings.contactEmail ? `<a href="mailto:${esc(settings.contactEmail)}">Email</a>` : ""}
        </div>
        <div class="footer-col">
          <h3>${esc(settings.companyName)}</h3>
          <p>${esc(settings.tagline || "")}</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} ${esc(settings.companyName)}. All rights reserved.</p>
      </div>
    </div>
  </footer>

  ${siteId ? `<script>
  (function() { try { fetch("/api/sites/${siteId}/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ page: location.hash?.replace("#", "") || "home" }) }); } catch(e) {} })();
  </script>` : ""}
  ${settings.enableChat && siteId ? chatWidgetHTML(siteId, settings.chatWelcomeMessage || "Hello! I'm here to help you find the perfect crystal piece. Ask me anything!") : ""}
</body>
</html>`;
}

export function renderSiteHTML(
  template: SiteTemplate,
  pages: { title: string; slug: string; content: string }[],
  settings: SiteSettings,
  siteId?: string
): string {
  if (template.id === "spiritual-ecommerce") {
    return renderEcommerceHTML(template, pages, settings, siteId);
  }

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

  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const pageTitle = esc(settings.seoTitle || `${settings.companyName} - ${settings.tagline}`);
  const metaDesc = esc(settings.seoDescription || `${settings.companyName} — ${settings.tagline}. ${settings.industry ? `${settings.industry}行业的专业B2B解决方案提供商。` : ""}`);
  const ogImage = settings.ogImage || "";
  const canonicalUrl = settings.customDomain ? `https://${settings.customDomain}` : (siteId ? `/api/sites/${siteId}/preview` : "");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.companyName,
    description: metaDesc,
    url: canonicalUrl,
    ...(settings.contactEmail ? { email: settings.contactEmail } : {}),
    ...(settings.contactPhone ? { telephone: settings.contactPhone } : {}),
    ...(settings.contactAddress ? { address: { "@type": "PostalAddress", streetAddress: settings.contactAddress } } : {}),
  };

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
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <style>
    :root { --primary: ${settings.primaryColor}; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; line-height: 1.6; }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
    header { background: white; border-bottom: 1px solid #e5e5e5; position: sticky; top: 0; z-index: 100; }
    header .container { display: flex; align-items: center; justify-content: space-between; padding-top: 16px; padding-bottom: 16px; }
    .logo { font-size: 1.25rem; font-weight: 700; color: var(--primary); }
    nav { display: flex; gap: 24px; align-items: center; }
    .nav-link { color: #666; text-decoration: none; font-size: 0.875rem; font-weight: 500; }
    .nav-link:hover { color: var(--primary); }
    .nav-inquiry-btn { background: var(--primary); color: white; border: none; padding: 8px 18px; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; font-family: inherit; transition: opacity 0.15s; white-space: nowrap; }
    .nav-inquiry-btn:hover { opacity: 0.88; }
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
    .contact-section { background: #f9fafb; padding: 80px 0; }
    .contact-form { max-width: 520px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
    .contact-form input, .contact-form textarea { width: 100%; padding: 12px 16px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; outline: none; font-family: inherit; }
    .contact-form input:focus, .contact-form textarea:focus { border-color: var(--primary); }
    .contact-form textarea { min-height: 120px; resize: vertical; }
    .contact-form button { background: var(--primary); color: white; border: none; padding: 14px 32px; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; }
    .contact-form button:hover { opacity: 0.9; }
    .contact-form button:disabled { opacity: 0.6; cursor: not-allowed; }
    .contact-msg { text-align: center; font-size: 0.875rem; margin-top: 8px; }
    .contact-info { text-align: center; margin-top: 32px; color: #888; font-size: 0.875rem; }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <div class="logo">${esc(settings.companyName)}</div>
      <nav>
        ${navLinks}
        ${settings.enableChat && siteId ? `<button class="nav-inquiry-btn" onclick="document.getElementById('vertax-chat-overlay').classList.add('open');document.body.style.overflow='hidden'">💬 Inquiry Desk</button>` : ""}
      </nav>
    </div>
  </header>
  ${pageHTML}
  <section id="contact" class="contact-section">
    <div class="container">
      <h1 style="text-align:center;margin-bottom:8px;">联系我们</h1>
      <p style="text-align:center;color:#888;margin-bottom:32px;">有任何问题或合作意向，欢迎留言</p>
      <form id="vertax-contact-form" class="contact-form" onsubmit="return false;">
        <input type="text" name="name" placeholder="您的姓名" required />
        <input type="email" name="email" placeholder="您的邮箱" required />
        <textarea name="message" placeholder="请描述您的需求…" required></textarea>
        <button type="submit" id="vertax-contact-btn">发送留言</button>
        <p id="vertax-contact-msg" class="contact-msg"></p>
      </form>
      <div class="contact-info">
        ${settings.contactEmail ? `<p>📧 ${esc(settings.contactEmail)}</p>` : ""}
        ${settings.contactPhone ? `<p>📞 ${esc(settings.contactPhone)}</p>` : ""}
        ${settings.contactAddress ? `<p>📍 ${esc(settings.contactAddress)}</p>` : ""}
      </div>
    </div>
  </section>
  ${
    siteId
      ? `<script>
(function() {
  var form = document.getElementById("vertax-contact-form");
  var btn = document.getElementById("vertax-contact-btn");
  var msg = document.getElementById("vertax-contact-msg");
  form.addEventListener("submit", async function(e) {
    e.preventDefault();
    var name = form.name.value.trim();
    var email = form.email.value.trim();
    var message = form.message.value.trim();
    if (!name || !email || !message) return;
    btn.disabled = true;
    btn.textContent = "发送中...";
    msg.textContent = "";
    msg.style.color = "";
    try {
      var resp = await fetch("/api/sites/${siteId}/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name, email: email, message: message })
      });
      var json = await resp.json();
      if (resp.ok) {
        msg.textContent = "发送成功，我们会尽快回复！";
        msg.style.color = "#16a34a";
        form.reset();
      } else {
        msg.textContent = json.error || "发送失败，请稍后再试";
        msg.style.color = "#dc2626";
      }
    } catch (err) {
      msg.textContent = "网络错误，请稍后再试";
      msg.style.color = "#dc2626";
    }
    btn.disabled = false;
    btn.textContent = "发送留言";
  });
})();
</script>`
      : ""
  }
  <footer>
    <div class="container">
      <p>&copy; ${new Date().getFullYear()} ${esc(settings.companyName)}. All rights reserved.</p>
      <p>${esc(settings.contactEmail)} | ${esc(settings.contactPhone)}</p>
    </div>
  </footer>
  ${siteId ? `<script>
  (function() {
    try {
      fetch("/api/sites/${siteId}/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ page: location.hash?.replace("#", "") || "home" }) });
    } catch(e) {}
  })();
  </script>` : ""}
  ${
    settings.enableChat && siteId
      ? chatWidgetHTML(siteId, settings.chatWelcomeMessage || "你好！有什么可以帮助你的？")
      : ""
  }
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

function chatWidgetHTML(siteId: string, welcomeMessage: string): string {
  return `
<style>
  .vertax-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5);
    z-index: 9999; display: none; align-items: center; justify-content: center;
  }
  .vertax-overlay.open { display: flex; }
  .vertax-modal {
    background: #fff; border-radius: 16px; width: 720px;
    max-width: calc(100vw - 32px); height: 600px;
    max-height: calc(100vh - 48px); display: flex; flex-direction: column;
    box-shadow: 0 16px 64px rgba(0,0,0,0.2); overflow: hidden;
  }
  .vertax-modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 24px; border-bottom: 1px solid #eee;
  }
  .vertax-modal-title { font-size: 1.125rem; font-weight: 700; color: #111; }
  .vertax-modal-close {
    background: none; border: none; font-size: 1.5rem; color: #999;
    cursor: pointer; width: 36px; height: 36px; display: flex; align-items: center;
    justify-content: center; border-radius: 8px; transition: all 0.15s;
  }
  .vertax-modal-close:hover { background: #f5f5f5; color: #333; }
  .vertax-modal-body {
    flex: 1; overflow-y: auto; padding: 20px 24px;
    display: flex; flex-direction: column; gap: 16px;
  }
  .vertax-msg { display: flex; gap: 10px; }
  .vertax-msg.user { flex-direction: row-reverse; }
  .vertax-msg-avatar {
    width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center;
    justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
  }
  .vertax-msg.bot .vertax-msg-avatar { background: #f0f0f0; color: #666; }
  .vertax-msg.user .vertax-msg-avatar { background: var(--primary); color: #fff; }
  .vertax-msg-bubble {
    max-width: 75%; padding: 12px 16px; border-radius: 12px; font-size: 0.875rem;
    line-height: 1.6; word-break: break-word;
  }
  .vertax-msg.bot .vertax-msg-bubble { background: #f5f5f5; color: #333; }
  .vertax-msg.user .vertax-msg-bubble { background: var(--primary); color: #fff; }
  .vertax-typing { display: flex; gap: 4px; padding: 12px 0; }
  .vertax-typing span {
    width: 6px; height: 6px; background: #ccc; border-radius: 50%;
    animation: vertax-bounce 1.4s infinite ease-in-out both;
  }
  .vertax-typing span:nth-child(1) { animation-delay: -0.32s; }
  .vertax-typing span:nth-child(2) { animation-delay: -0.16s; }
  @keyframes vertax-bounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
  .vertax-suggestions { display: flex; flex-wrap: wrap; gap: 8px; }
  .vertax-suggestion {
    background: transparent; color: #555; border: 1px solid #ddd;
    border-radius: 8px; padding: 8px 14px; font-size: 0.8125rem;
    cursor: pointer; font-family: inherit; transition: all 0.15s;
  }
  .vertax-suggestion:hover { border-color: var(--primary); color: var(--primary); }
  .vertax-modal-footer {
    padding: 16px 24px; border-top: 1px solid #eee; display: flex; gap: 12px;
  }
  .vertax-modal-footer textarea {
    flex: 1; border: 1px solid #ddd; border-radius: 10px; padding: 10px 14px;
    font-size: 0.875rem; outline: none; resize: none; min-height: 44px;
    font-family: inherit; line-height: 1.5; transition: border-color 0.15s;
  }
  .vertax-modal-footer textarea:focus { border-color: var(--primary); }
  .vertax-send-btn {
    background: var(--primary); color: #fff; border: none; border-radius: 10px;
    padding: 0 20px; font-weight: 600; font-size: 0.875rem; cursor: pointer;
    font-family: inherit; transition: opacity 0.15s; white-space: nowrap;
  }
  .vertax-send-btn:hover { opacity: 0.88; }
  .vertax-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  @media (max-width: 768px) {
    .vertax-modal { height: 100vh; max-height: 100vh; border-radius: 0; max-width: 100vw; }
  }
</style>

<div id="vertax-chat-overlay" class="vertax-overlay">
  <div class="vertax-modal">
    <div class="vertax-modal-header">
      <span class="vertax-modal-title">Inquiry Desk</span>
      <button class="vertax-modal-close" id="vertax-chat-close">&times;</button>
    </div>
    <div class="vertax-modal-body">
      <div id="vertax-chat-messages"></div>
      <div id="vertax-chat-suggestions" class="vertax-suggestions"></div>
    </div>
    <div class="vertax-modal-footer">
      <textarea id="vertax-chat-input" rows="1" placeholder="Ask about products, pricing, or sourcing guidance..."></textarea>
      <button class="vertax-send-btn" id="vertax-chat-send">Send</button>
    </div>
  </div>
</div>

<script>
(function() {
  var siteId = ${JSON.stringify(siteId)};
  var sessionId = localStorage.getItem("vertax_site_chat_" + siteId) || "";
  var welcomeMessage = ${JSON.stringify(welcomeMessage)};
  var loading = false;
  var history = [];

  var overlay = document.getElementById("vertax-chat-overlay");
  var messagesEl = document.getElementById("vertax-chat-messages");
  var inputEl = document.getElementById("vertax-chat-input");
  var sendBtn = document.getElementById("vertax-chat-send");
  var suggestionsEl = document.getElementById("vertax-chat-suggestions");

  var defaultSuggestions = [
    "Tell me about your main products and specifications.",
    "Which certifications do you have for export?",
    "What are your MOQ and typical lead times?",
    "Help me prepare an inquiry with product details."
  ];

  function renderSuggestions() {
    if (!suggestionsEl) return;
    suggestionsEl.innerHTML = "";
    defaultSuggestions.forEach(function(s) {
      var btn = document.createElement("button");
      btn.className = "vertax-suggestion";
      btn.textContent = s;
      btn.addEventListener("click", function() {
        inputEl.value = s;
        inputEl.focus();
      });
      suggestionsEl.appendChild(btn);
    });
  }

  function addBubble(text, type) {
    var wrap = document.createElement("div");
    wrap.className = "vertax-msg " + type;
    var avatar = document.createElement("div");
    avatar.className = "vertax-msg-avatar";
    avatar.textContent = type === "bot" ? "AI" : "U";
    var bubble = document.createElement("div");
    bubble.className = "vertax-msg-bubble";
    bubble.textContent = text;
    wrap.appendChild(avatar);
    wrap.appendChild(bubble);
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    var wrap = document.createElement("div");
    wrap.className = "vertax-msg bot";
    wrap.id = "vertax-chat-typing";
    var avatar = document.createElement("div");
    avatar.className = "vertax-msg-avatar";
    avatar.textContent = "AI";
    var dots = document.createElement("div");
    dots.className = "vertax-typing";
    dots.innerHTML = "<span></span><span></span><span></span>";
    wrap.appendChild(avatar);
    wrap.appendChild(dots);
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    var el = document.getElementById("vertax-chat-typing");
    if (el) el.remove();
  }

  function setLoading(v) {
    loading = v;
    sendBtn.disabled = v;
    inputEl.disabled = v;
    sendBtn.textContent = v ? "..." : "Send";
  }

  function addWelcome() {
    if (welcomeMessage) {
      addBubble(welcomeMessage, "bot");
    }
  }

  async function sendMessage() {
    var text = inputEl.value.trim();
    if (!text || loading) return;
    inputEl.value = "";
    addBubble(text, "user");
    history.push({ role: "user", content: text });
    setLoading(true);
    showTyping();
    if (suggestionsEl) suggestionsEl.style.display = "none";

    try {
      var resp = await fetch("/api/sites/" + siteId + "/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, session_id: sessionId, history: history })
      });
      var json = await resp.json();
      hideTyping();

      if (json.data) {
        sessionId = json.data.session_id || sessionId;
        if (sessionId) {
          localStorage.setItem("vertax_site_chat_" + siteId, sessionId);
        }
        var answer = json.data.answer || "Sorry, I cannot answer that question right now.";
        addBubble(answer, "bot");
        history.push({ role: "assistant", content: answer });
      } else {
        addBubble("Sorry, something went wrong. Please try again.", "bot");
      }
    } catch (e) {
      hideTyping();
      addBubble("Network error. Please try again.", "bot");
    }
    setLoading(false);
  }

  overlay.addEventListener("click", function(e) {
    if (e.target === overlay) {
      overlay.classList.remove("open");
      document.body.style.overflow = "";
    }
  });

  document.getElementById("vertax-chat-close").addEventListener("click", function() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  });

  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape" && overlay.classList.contains("open")) {
      overlay.classList.remove("open");
      document.body.style.overflow = "";
    }
  });

  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      if (m.attributeName === "class" && overlay.classList.contains("open")) {
        inputEl.focus();
        if (messagesEl.children.length === 0) {
          addWelcome();
          renderSuggestions();
        }
      }
    });
  });
  observer.observe(overlay, { attributes: true, attributeFilter: ["class"] });

  sendBtn.addEventListener("click", sendMessage);
  inputEl.addEventListener("keydown", function(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
})();
</script>`;
}
