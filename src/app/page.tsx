import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VertaX — AI 驱动的 B2B 获客平台",
  description: "知识库 RAG、AI 内容工坊、线索管理 CRM、数据分析 Dashboard、独立站生成。一站搞定 B2B 获客。",
  openGraph: {
    title: "VertaX — AI 驱动的 B2B 获客平台",
    description: "知识库、内容工坊、线索管理，一站搞定 B2B 获客。",
    type: "website",
  },
};

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 font-sans">
      <main className="flex flex-col items-center gap-8 py-32 px-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-black">
          VertaX
        </h1>
        <p className="max-w-md text-lg leading-8 text-zinc-600">
          AI 驱动的 B2B 获客平台——知识库、内容工坊、线索管理，一站搞定。
        </p>
        <a
          href="/login"
          className="flex h-12 items-center justify-center rounded-full bg-black px-8 text-white transition-colors hover:bg-zinc-800"
        >
          开始使用
        </a>
      </main>
    </div>
  );
}
