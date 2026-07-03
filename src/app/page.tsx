import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "VertaX — AI 驱动的 B2B 获客平台",
  description: "知识库 RAG、AI 内容工坊、线索管理 CRM、数据分析 Dashboard、独立站生成。一站搞定 B2B 获客。",
  openGraph: {
    title: "VertaX — AI 驱动的 B2B 获客平台",
    description: "知识库、内容工坊、线索管理，一站搞定 B2B 获客。",
    type: "website",
  },
};

const features = [
  {
    title: "知识库 RAG",
    desc: "上传 PDF/Word/Markdown 文档，自动解析、向量化，AI 精准回答任何基于文档的问题。",
    icon: "📚",
  },
  {
    title: "AI 内容工坊",
    desc: "多模板、多语言 AI 文案生成，SEO 优化建议，内容版本管理，一键翻译。",
    icon: "✍️",
  },
  {
    title: "线索管理 CRM",
    desc: "线索录入、状态流转、沟通记录、CSV 导入导出，轻量但强大的 CRM 系统。",
    icon: "🎯",
  },
  {
    title: "数据分析仪表盘",
    desc: "统计卡片、月度趋势图表、内容排行榜，数据驱动你的获客决策。",
    icon: "📊",
  },
  {
    title: "AI 独立站生成",
    desc: "3 套精美模板，AI 自动生成网站内容，SEO 优化，一键发布上线。",
    icon: "🚀",
  },
  {
    title: "团队协作",
    desc: "4 级权限体系（Owner/Admin/Editor/Viewer），邀请成员，实时协作。",
    icon: "👥",
  },
];

const steps = [
  { step: "1", title: "注册账号", desc: "14 天免费试用，无需信用卡" },
  { step: "2", title: "上传知识库", desc: "导入产品文档，AI 自动学习" },
  { step: "3", title: "生成内容 & 独立站", desc: "AI 写文案、建网站，一键搞定" },
  { step: "4", title: "获客 & 分析", desc: "管理线索，追踪数据，持续优化" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ====== Header ====== */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-white sticky top-0 z-50">
        <Link href="/" className="text-xl font-bold tracking-tight text-black">
          VertaX
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-600">
          <a href="#features">功能</a>
          <a href="#how-it-works">工作流</a>
          <Link href="/pricing">定价</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-zinc-600 hover:text-black transition-colors">
            登录
          </Link>
          <Link
            href="/register"
            className="text-sm rounded-lg bg-black text-white px-4 py-2 hover:bg-zinc-800 transition-colors"
          >
            免费注册
          </Link>
        </div>
      </header>

      {/* ====== Hero ====== */}
      <section className="text-center py-24 px-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-xs font-medium text-zinc-500 mb-8">
          🚀 AI 驱动的 B2B 获客平台
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-black leading-tight">
          用 AI 把获客效率
          <br />
          <span className="text-zinc-400">提升 10 倍</span>
        </h1>
        <p className="mt-6 text-lg text-zinc-500 max-w-xl mx-auto leading-relaxed">
          知识库问答、AI 写文案、线索管理、数据分析和独立站建站——
          <br className="hidden sm:block" />
          不用再在 5 个工具之间切来切去。
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-black px-8 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
          >
            开始免费试用
          </Link>
          <Link
            href="/pricing"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-zinc-200 bg-white px-8 text-sm font-medium text-black hover:bg-zinc-50 transition-colors"
          >
            查看定价
          </Link>
        </div>
      </section>

      {/* ====== Features ====== */}
      <section id="features" className="py-24 px-6 bg-zinc-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-black">
              一站搞定 B2B 获客全流程
            </h2>
            <p className="mt-3 text-zinc-500">
              从知识沉淀到内容分发，从线索获取到数据分析
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-zinc-200 bg-white p-6 hover:shadow-md transition-shadow"
              >
                <div className="text-2xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-black mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== How It Works ====== */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-black">
              四步开始你的 AI 获客之旅
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-bold text-black mb-1">{s.title}</h3>
                <p className="text-sm text-zinc-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== Pricing Preview ====== */}
      <section className="py-24 px-6 bg-zinc-50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-4">
            简单透明的定价
          </h2>
          <p className="text-zinc-500 mb-10">
            14 天免费试用，无需信用卡。随时升级，随时取消。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h3 className="font-bold text-black mb-1">Free</h3>
              <p className="text-2xl font-bold text-black mb-4">免费</p>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li>✓ 最多 3 名成员</li>
                <li>✓ 1 个独立站</li>
                <li>✓ 10 条内容</li>
                <li>✓ 每日 5 次 AI 生成</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-black bg-white p-6 relative scale-[1.03] shadow-lg">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-black text-white text-xs px-3 py-1 font-medium">
                推荐
              </span>
              <h3 className="font-bold text-black mb-1">Pro</h3>
              <p className="text-2xl font-bold text-black mb-4">$29/月</p>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li>✓ 最多 10 名成员</li>
                <li>✓ 10 个独立站</li>
                <li>✓ 100 条内容</li>
                <li>✓ 每日 50 次 AI 生成</li>
                <li>✓ API 访问</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h3 className="font-bold text-black mb-1">Enterprise</h3>
              <p className="text-2xl font-bold text-black mb-4">$99/月</p>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li>✓ 无限成员</li>
                <li>✓ 无限独立站</li>
                <li>✓ 无限内容 & AI 生成</li>
                <li>✓ 专属客服</li>
                <li>✓ SSO 单点登录</li>
              </ul>
            </div>
          </div>
          <Link
            href="/pricing"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-zinc-200 bg-white px-8 text-sm font-medium text-black hover:bg-zinc-50 transition-colors mt-10"
          >
            查看完整定价
          </Link>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="py-24 px-6 text-center">
        <h2 className="text-3xl font-bold text-black mb-4">
          准备好提升你的获客效率了吗？
        </h2>
        <p className="text-zinc-500 mb-8">
          免费试用 14 天，随时取消，无需信用卡。
        </p>
        <Link
          href="/register"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-black px-10 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
        >
          立即免费开始
        </Link>
      </section>

      {/* ====== Footer ====== */}
      <footer className="border-t border-zinc-200 bg-zinc-50 px-6 py-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-zinc-400">
            &copy; {new Date().getFullYear()} VertaX. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/login" className="hover:text-black transition-colors">登录</Link>
            <Link href="/register" className="hover:text-black transition-colors">注册</Link>
            <Link href="/pricing" className="hover:text-black transition-colors">定价</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
