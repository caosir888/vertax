import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "入门指南 — 智客",
};

const modules = [
  {
    title: "知识库 RAG",
    href: "/knowledge",
    icon: "📚",
    steps: [
      "上传 PDF / Word / Markdown 文档",
      "系统自动解析、分块、向量化",
      "在「知识库对话」中提问，AI 基于文档精准回答",
    ],
  },
  {
    title: "AI 内容工坊",
    href: "/content",
    icon: "✍️",
    steps: [
      "选择模板（产品介绍 / SEO 文章 / 邮件 / 社交媒体）",
      "输入关键词和要点",
      "AI 生成多版本草稿，人工润色后一键发布",
    ],
  },
  {
    title: "线索管理 CRM",
    href: "/leads",
    icon: "🎯",
    steps: [
      "手动录入或 CSV 批量导入线索",
      "按状态流转：新线索 → 已联系 → 已确认 → 提案 → 成交",
      "记录每次沟通，设置下次跟进提醒",
    ],
  },
  {
    title: "AI 独立站",
    href: "/sites",
    icon: "🌐",
    steps: [
      "选择模板（Modern / Minimal / Bold）",
      "AI 自动生成网站内容（基于知识库）",
      "自定义页面、SEO 设置、一键发布",
    ],
  },
  {
    title: "数据分析",
    href: "/analytics",
    icon: "📈",
    steps: [
      "查看线索转化漏斗和趋势",
      "追踪内容表现（阅读量、互动量）",
      "根据数据优化获客策略",
    ],
  },
];

export default function GuidePage() {
  return (
    <div className="px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-black">入门指南</h1>
        <p className="mt-2 text-sm text-zinc-500">5 分钟快速上手智客，开启 AI 获客之旅</p>

        {/* 快速开始 */}
        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-bold text-black flex items-center gap-2">
            <span>🚀</span> 快速开始三步
          </h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: "1", title: "上传知识库", desc: "导入你的产品文档，让 AI 学习你的业务" },
              { step: "2", title: "生成第一条内容", desc: "用 AI 写一篇产品介绍，5 分钟产出初稿" },
              { step: "3", title: "导入第一批线索", desc: "手动录入或 CSV 导入，开始追踪客户" },
            ].map((s) => (
              <div key={s.step} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                  {s.step}
                </span>
                <div>
                  <p className="text-sm font-medium text-black">{s.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 模块指南 */}
        <div className="mt-8 space-y-4">
          <h2 className="text-sm font-bold text-black">核心模块</h2>
          {modules.map((mod) => (
            <div key={mod.title} className="rounded-xl border border-zinc-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl">{mod.icon}</span>
                <h3 className="font-bold text-black">{mod.title}</h3>
                <Link
                  href={mod.href}
                  className="ml-auto text-xs text-zinc-400 hover:text-black transition-colors"
                >
                  前往 →
                </Link>
              </div>
              <ol className="space-y-2">
                {mod.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-600">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        {/* 小贴士 */}
        <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-6">
          <h2 className="text-sm font-bold text-black flex items-center gap-2">
            <span>💡</span> 小贴士
          </h2>
          <ul className="mt-3 space-y-2">
            {[
              "知识库文档越多、越结构化，AI 回答越精准",
              "AI 生成的内容建议人工审核后再发布",
              "善用标签和状态管理线索，避免跟丢",
              "独立站支持自定义域名，在站点设置中配置",
              "按 ⌘K 打开全局搜索，快速找到任何内容",
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-600">
                <span className="text-zinc-300">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
