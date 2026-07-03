"use client";

import { useState } from "react";

const endpoints = [
  {
    method: "GET",
    path: "/api/v1/health",
    desc: "验证 API Key 是否有效",
    example: `curl -H "Authorization: Bearer vx_YOUR_API_KEY" \\
  https://your-domain.com/api/v1/health`,
    response: `{ "status": "ok", "team_id": "uuid", "version": "v1" }`,
  },
  {
    method: "GET",
    path: "/api/v1/leads",
    desc: "获取线索列表",
    params: "?status=new&search=xxx&limit=50&offset=0",
    example: `curl -H "Authorization: Bearer vx_YOUR_API_KEY" \\
  "https://your-domain.com/api/v1/leads?status=new&limit=20"`,
    response: `{ "data": [...], "pagination": { "limit": 20, "offset": 0 } }`,
  },
  {
    method: "POST",
    path: "/api/v1/leads",
    desc: "创建新线索",
    example: `curl -X POST \\
  -H "Authorization: Bearer vx_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"张三","company":"某某公司","email":"z@example.com"}' \\
  "https://your-domain.com/api/v1/leads"`,
    response: `{ "data": { "id": "uuid", "name": "张三", ... } }`,
  },
  {
    method: "GET",
    path: "/api/v1/leads/:id",
    desc: "获取单条线索详情",
    example: `curl -H "Authorization: Bearer vx_YOUR_API_KEY" \\
  "https://your-domain.com/api/v1/leads/UUID"`,
    response: `{ "data": { "id": "uuid", "name": "...", "status": "...", ... } }`,
  },
  {
    method: "PATCH",
    path: "/api/v1/leads/:id",
    desc: "更新线索（支持部分更新）",
    example: `curl -X PATCH \\
  -H "Authorization: Bearer vx_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"status":"contacted"}' \\
  "https://your-domain.com/api/v1/leads/UUID"`,
    response: `{ "data": { "id": "uuid", "status": "contacted", ... } }`,
  },
  {
    method: "GET",
    path: "/api/v1/content",
    desc: "获取内容列表",
    params: "?status=published&language=zh-CN&limit=50&offset=0",
    example: `curl -H "Authorization: Bearer vx_YOUR_API_KEY" \\
  "https://your-domain.com/api/v1/content?status=published"`,
    response: `{ "data": [...], "pagination": { "limit": 50, "offset": 0 } }`,
  },
  {
    method: "POST",
    path: "/api/v1/content",
    desc: "创建内容",
    example: `curl -X POST \\
  -H "Authorization: Bearer vx_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"产品介绍","content":"...","language":"zh-CN"}' \\
  "https://your-domain.com/api/v1/content"`,
    response: `{ "data": { "id": "uuid", "title": "产品介绍", ... } }`,
  },
  {
    method: "GET",
    path: "/api/v1/knowledge/search",
    desc: "语义搜索知识库",
    params: "?q=关键词&kb_id=可选&top=5",
    example: `curl -H "Authorization: Bearer vx_YOUR_API_KEY" \\
  "https://your-domain.com/api/v1/knowledge/search?q=产品特点&top=3"`,
    response: `{ "data": [...], "query": "产品特点" }`,
  },
];

const methodColors: Record<string, string> = {
  GET: "bg-green-100 text-green-700",
  POST: "bg-blue-100 text-blue-700",
  PATCH: "bg-yellow-100 text-yellow-700",
  DELETE: "bg-red-100 text-red-700",
};

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">API 文档</h1>
        <p className="text-zinc-500 mt-1">
          使用 API Key 接入 VertaX。在「设置 → API Keys」中创建密钥。
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold mb-3">认证方式</h2>
        <p className="text-sm text-zinc-600 mb-3">
          所有 API 请求需在 <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs">Authorization</code> header 中携带 API Key：
        </p>
        <pre className="bg-zinc-100 p-3 rounded-md overflow-x-auto text-sm">
          <code>Authorization: Bearer vx_YOUR_API_KEY</code>
        </pre>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold mb-3">速率限制</h2>
        <ul className="text-sm text-zinc-600 list-disc pl-5 space-y-1">
          <li>查询接口：60 次/分钟</li>
          <li>写入接口：30 次/分钟</li>
          <li>超出限制返回 <code className="bg-zinc-100 px-1 rounded text-xs">429 Too Many Requests</code></li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">接口列表</h2>
        {endpoints.map((ep, i) => (
          <div
            key={i}
            className="rounded-lg border border-zinc-200 bg-white cursor-pointer hover:border-zinc-300 transition-colors"
            onClick={() => setActiveTab(activeTab === ep.path ? null : ep.path)}
          >
            <div className="p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${methodColors[ep.method] || "bg-zinc-100 text-zinc-600"}`}>
                  {ep.method}
                </span>
                <code className="text-sm font-mono">{ep.path}</code>
                <span className="text-sm text-zinc-500">{ep.desc}</span>
              </div>
              {ep.params && (
                <p className="text-xs text-zinc-400 mt-2">参数: {ep.params}</p>
              )}

              {activeTab === ep.path && (
                <div className="mt-4 space-y-3 border-t pt-4 border-zinc-100">
                  <div>
                    <p className="text-xs font-semibold text-zinc-600 mb-1">请求示例</p>
                    <pre className="bg-zinc-950 text-zinc-50 p-3 rounded-md overflow-x-auto text-xs leading-relaxed">
                      <code>{ep.example}</code>
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-600 mb-1">响应示例</p>
                    <pre className="bg-zinc-950 text-zinc-50 p-3 rounded-md overflow-x-auto text-xs leading-relaxed">
                      <code>{ep.response}</code>
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
