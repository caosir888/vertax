export default function KnowledgePage() {
  return (
    <div className="px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-black">知识库</h1>
        <p className="mt-2 text-sm text-zinc-500">
          上传文档（PDF/Word/TXT/Markdown），AI 自动解析并建立知识库，支持智能问答。
        </p>
        <div className="mt-8 rounded-lg border border-dashed border-zinc-300 py-24 text-center text-sm text-zinc-400">
          知识库功能将在第 5 周实现（RAG 引擎）
        </div>
      </div>
    </div>
  );
}
