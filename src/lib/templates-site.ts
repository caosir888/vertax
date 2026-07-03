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

export function renderSiteHTML(
  template: SiteTemplate,
  pages: { title: string; slug: string; content: string }[],
  settings: SiteSettings,
  siteId?: string
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
      <nav>${navLinks}</nav>
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
  .vertax-chat-btn { position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px; border-radius: 50%; background: var(--primary); color: white; border: none; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; font-size: 24px; z-index: 9999; transition: transform 0.2s; }
  .vertax-chat-btn:hover { transform: scale(1.08); }
  .vertax-chat-panel { position: fixed; bottom: 96px; right: 24px; width: 380px; max-width: calc(100vw - 48px); height: 520px; max-height: calc(100vh - 140px); background: white; border-radius: 16px; box-shadow: 0 8px 40px rgba(0,0,0,0.16); z-index: 9998; display: none; flex-direction: column; overflow: hidden; font-size: 14px; }
  .vertax-chat-panel.open { display: flex; }
  .vertax-chat-header { background: var(--primary); color: white; padding: 16px 20px; font-weight: 600; display: flex; align-items: center; justify-content: space-between; }
  .vertax-chat-close { background: none; border: none; color: white; cursor: pointer; font-size: 18px; opacity: 0.8; }
  .vertax-chat-close:hover { opacity: 1; }
  .vertax-chat-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
  .vertax-chat-bubble { max-width: 85%; padding: 10px 14px; border-radius: 12px; line-height: 1.5; word-break: break-word; }
  .vertax-chat-bubble.user { align-self: flex-end; background: var(--primary); color: white; border-bottom-right-radius: 4px; }
  .vertax-chat-bubble.bot { align-self: flex-start; background: #f3f4f6; color: #1a1a1a; border-bottom-left-radius: 4px; }
  .vertax-chat-bubble.bot p { margin: 0; color: #1a1a1a; }
  .vertax-chat-bubble.bot p + p { margin-top: 0.5em; }
  .vertax-chat-typing { align-self: flex-start; display: flex; gap: 4px; padding: 10px 14px; }
  .vertax-chat-typing span { width: 8px; height: 8px; background: #aaa; border-radius: 50%; animation: vertax-bounce 1.4s infinite ease-in-out both; }
  .vertax-chat-typing span:nth-child(1) { animation-delay: -0.32s; }
  .vertax-chat-typing span:nth-child(2) { animation-delay: -0.16s; }
  @keyframes vertax-bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
  .vertax-chat-input-wrap { border-top: 1px solid #e5e5e5; padding: 12px 16px; display: flex; gap: 8px; }
  .vertax-chat-input-wrap input { flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 10px 12px; font-size: 14px; outline: none; }
  .vertax-chat-input-wrap input:focus { border-color: var(--primary); }
  .vertax-chat-input-wrap button { background: var(--primary); color: white; border: none; border-radius: 8px; padding: 10px 16px; cursor: pointer; font-weight: 600; font-size: 14px; }
  .vertax-chat-input-wrap button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
<div id="vertax-chat-btn" class="vertax-chat-btn" title="在线咨询">💬</div>
<div id="vertax-chat-panel" class="vertax-chat-panel">
  <div class="vertax-chat-header">
    <span>在线咨询</span>
    <button id="vertax-chat-close" class="vertax-chat-close">✕</button>
  </div>
  <div id="vertax-chat-messages" class="vertax-chat-messages"></div>
  <div class="vertax-chat-input-wrap">
    <input id="vertax-chat-input" type="text" placeholder="输入你的问题…" />
    <button id="vertax-chat-send">发送</button>
  </div>
</div>
<script>
(function() {
  var siteId = ${JSON.stringify(siteId)};
  var sessionId = localStorage.getItem("vertax_site_chat_" + siteId) || "";
  var welcomeMessage = ${JSON.stringify(welcomeMessage)};
  var loading = false;
  var history = [];

  var btn = document.getElementById("vertax-chat-btn");
  var panel = document.getElementById("vertax-chat-panel");
  var closeBtn = document.getElementById("vertax-chat-close");
  var messagesEl = document.getElementById("vertax-chat-messages");
  var inputEl = document.getElementById("vertax-chat-input");
  var sendBtn = document.getElementById("vertax-chat-send");

  function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function simpleMarkdown(text) {
    return text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\\*\\*(.+?)\\*\\*/g, "<strong>$1</strong>")
      .replace(/\\n\\n/g, "</p><p>")
      .replace(/\\n/g, "<br>")
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/^(?!<[li]|<p|<strong|<br)(.+)$/gm, "<p>$1</p>");
  }

  function addBubble(text, type) {
    var div = document.createElement("div");
    div.className = "vertax-chat-bubble " + type;
    div.innerHTML = type === "bot" ? simpleMarkdown(text) : escapeHtml(text);
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    var div = document.createElement("div");
    div.className = "vertax-chat-typing";
    div.id = "vertax-chat-typing";
    div.innerHTML = "<span></span><span></span><span></span>";
    messagesEl.appendChild(div);
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
        var answer = json.data.answer || "抱歉，我暂时无法回答这个问题。";
        addBubble(answer, "bot");
        history.push({ role: "assistant", content: answer });
      } else {
        addBubble("抱歉，出了点问题，请稍后再试。", "bot");
      }
    } catch (e) {
      hideTyping();
      addBubble("网络错误，请稍后再试。", "bot");
    }
    setLoading(false);
  }

  btn.addEventListener("click", function() {
    panel.classList.toggle("open");
    if (panel.classList.contains("open") && !messagesEl.children.length) {
      addWelcome();
    }
  });

  closeBtn.addEventListener("click", function() {
    panel.classList.remove("open");
  });

  sendBtn.addEventListener("click", sendMessage);
  inputEl.addEventListener("keydown", function(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
})();
</script>`;
}
