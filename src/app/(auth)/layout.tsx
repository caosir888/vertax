import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s — 智客",
    default: "智客 VertaX — AI 内容获客，从第一篇文章开始",
  },
  description: "AI 驱动的内容获客平台，一站式知识库、内容工坊、线索管理。",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
