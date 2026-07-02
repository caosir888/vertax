import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s — VertaX",
    default: "VertaX — AI 驱动的 B2B 获客平台",
  },
  description: "AI 驱动的 B2B 获客平台，一站式知识库、内容工坊、线索管理。",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
