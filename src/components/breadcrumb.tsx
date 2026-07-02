"use client";

import { usePathname } from "next/navigation";

const labelMap: Record<string, string> = {
  dashboard: "概览",
  memos: "备忘录",
  knowledge: "知识库",
  content: "内容工坊",
  leads: "线索管理",
  analytics: "数据分析",
  settings: "设置",
};

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // 第一个有效段作为根路径
  const root = segments[0];
  const isDetail = segments.length > 1;

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      <span className="text-zinc-400">/</span>
      {root && labelMap[root] ? (
        <a
          href={`/${root}`}
          className="text-zinc-500 hover:text-black transition-colors"
        >
          {labelMap[root]}
        </a>
      ) : (
        <span className="text-zinc-500">{root || "概览"}</span>
      )}
      {isDetail && (
        <>
          <span className="text-zinc-300">/</span>
          <span className="text-black font-medium">
            {segments.length === 2 && root === "memos" ? "详情" : segments[segments.length - 1]}
          </span>
        </>
      )}
    </nav>
  );
}
