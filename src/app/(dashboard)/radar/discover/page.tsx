"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface DiscoveredLead {
  id: string;
  name: string;
  company: string;
  email: string;
  status: string;
  notes: string;
  created_at: string;
  ai_score?: number;
}

export default function DiscoverPage() {
  const [leads, setLeads] = useState<DiscoveredLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leads?source=radar&limit=50")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setLeads(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tabs = [
    { href: "/radar", label: "总览", active: false },
    { href: "/radar/icp", label: "目标客户画像", active: false },
    { href: "/radar/discover", label: "新发现", active: true },
    { href: "/leads", label: "线索库", active: false },
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">新发现</h1>
        <p className="text-sm text-zinc-500 mt-1">AI 雷达发现的潜在客户列表</p>
      </div>

      <div className="flex gap-1 bg-zinc-100 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab.active ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">加载中...</p>
      ) : leads.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center">
          <p className="text-zinc-500">暂无线索</p>
          <p className="text-sm text-zinc-400 mt-1">前往总览页启动自动搜索</p>
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 text-left">
                  <th className="px-4 py-3 font-medium text-zinc-600">联系人</th>
                  <th className="px-4 py-3 font-medium text-zinc-600">公司</th>
                  <th className="px-4 py-3 font-medium text-zinc-600">邮箱</th>
                  <th className="px-4 py-3 font-medium text-zinc-600">状态</th>
                  <th className="px-4 py-3 font-medium text-zinc-600">发现时间</th>
                  <th className="px-4 py-3 font-medium text-zinc-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium">{lead.name}</td>
                    <td className="px-4 py-3">{lead.company}</td>
                    <td className="px-4 py-3 text-zinc-500">{lead.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        {lead.status === "new" ? "新线索" : lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      {new Date(lead.created_at).toLocaleString("zh-CN")}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/leads`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        查看
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
