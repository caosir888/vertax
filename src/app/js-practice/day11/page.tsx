"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Day11Page() {
  const [step, setStep] = useState(1);
  const [apiLogs, setApiLogs] = useState<string[]>([]);

  async function testRegisterAPI() {
    const testEmail = `test${Date.now()}@example.com`;
    const body = {
      name: "测试用户",
      email: testEmail,
      password: "12345678",
      confirmPassword: "12345678",
    };

    setApiLogs([`📤 发送 POST 到 /api/auth/register`, `请求体: ${JSON.stringify(body)}`]);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      setApiLogs((prev) => [
        ...prev,
        `📥 响应状态: ${res.status}`,
        `响应内容: ${JSON.stringify(json, null, 2)}`,
        res.ok ? "✅ 注册成功！去 Supabase 后台查看 users 表" : `❌ ${json.error}`,
      ]);
    } catch {
      setApiLogs((prev) => [...prev, "❌ 网络错误"]);
    }
  }

  async function testValidation() {
    setApiLogs([]);
    const tests = [
      { body: { name: "", email: "a@b.com", password: "12345678", confirmPassword: "12345678" }, desc: "空姓名" },
      { body: { name: "张三", email: "", password: "12345678", confirmPassword: "12345678" }, desc: "空邮箱" },
      { body: { name: "张三", email: "a@b.com", password: "1234", confirmPassword: "1234" }, desc: "密码太短" },
      { body: { name: "张三", email: "a@b.com", password: "12345678", confirmPassword: "87654321" }, desc: "两次密码不一致" },
    ];

    for (const test of tests) {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(test.body),
      });
      const json = await res.json();
      setApiLogs((prev) => [
        ...prev,
        `🧪 ${test.desc}: 状态 ${res.status} → ${json.error}`,
      ]);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-black">
            Day 11: API Routes + 注册页接入数据库
          </h1>
          <p className="mt-2 text-zinc-600">
            理解 Next.js API Routes → 注册表单 → POST 请求 → 数据写入 Supabase
          </p>
        </div>

        {/* ============ 一、什么是 API Route ============ */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">
            一、回顾：Next.js API Routes 是什么
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Next.js 的 <code className="rounded bg-zinc-100 px-1">app/api/</code>{" "}
            文件夹里的文件 = 后端代码。每个文件导出 GET/POST/PUT/DELETE 函数，就对应一个 HTTP 接口。
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
              <div className="font-mono font-bold text-green-800">app/api/auth/register/route.ts</div>
              <div className="mt-2 font-mono text-xs text-green-700">
                <div><span className="text-blue-600">export async function</span> <span className="text-yellow-600">POST</span>(request) {"{"}</div>
                <div className="pl-3 text-zinc-500">// 1. 读取前端发来的数据</div>
                <div className="pl-3"><span className="text-blue-600">const</span> body = <span className="text-blue-600">await</span> request.json();</div>
                <div className="pl-3 text-zinc-500">// 2. 验证数据</div>
                <div className="pl-3"><span className="text-blue-600">if</span> (!body.name) ...</div>
                <div className="pl-3 text-zinc-500">// 3. 写入 Supabase</div>
                <div className="pl-3"><span className="text-blue-600">await</span> supabase.from(<span className="text-orange-300">&quot;users&quot;</span>).insert(...)</div>
                <div className="pl-3 text-zinc-500">// 4. 返回结果</div>
                <div className="pl-3"><span className="text-blue-600">return</span> NextResponse.json(...)</div>
                <div>{"}"}</div>
              </div>
            </div>

            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-sm">
              <div className="font-mono font-bold text-purple-800">app/register/page.tsx（前端）</div>
              <div className="mt-2 font-mono text-xs text-purple-700">
                <div><span className="text-blue-600">const</span> res = <span className="text-blue-600">await</span> <span className="text-yellow-600">fetch</span>(</div>
                <div className="pl-3"><span className="text-orange-300">&quot;/api/auth/register&quot;</span>,</div>
                <div className="pl-3">{"{"} method: <span className="text-orange-300">&quot;POST&quot;</span>,</div>
                <div className="pl-3">  headers: {"{"} <span className="text-orange-300">&quot;Content-Type&quot;: &quot;application/json&quot;</span> {"}"},</div>
                <div className="pl-3">  body: JSON.stringify({"{"} name, email, password {"}"})</div>
                <div className="pl-3">{"}"}</div>
                <div>);</div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-zinc-900 p-4 font-mono text-xs text-green-400">
            <div><span className="text-zinc-500">// 文件夹路径 = URL 路径</span></div>
            <div>app/api/auth/register/ → /api/auth/register</div>
            <div>app/api/users/ → /api/users</div>
            <div className="mt-1"><span className="text-zinc-500">// 导出函数名 = HTTP 方法</span></div>
            <div><span className="text-blue-400">export GET</span>() → 处理 GET 请求（读数据）</div>
            <div><span className="text-blue-400">export POST</span>() → 处理 POST 请求（写数据）</div>
            <div><span className="text-blue-400">export PUT</span>() → 处理 PUT 请求（改数据）</div>
            <div><span className="text-blue-400">export DELETE</span>() → 处理 DELETE 请求（删数据）</div>
          </div>
        </section>

        {/* ============ 二、注册 API 全链路 ============ */}
        <section className="rounded-xl border border-blue-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">
            二、注册全链路（浏览器 → API → 数据库）
          </h2>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium sm:gap-3">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
              1. 用户填表单
            </span>
            <span className="text-zinc-300">→</span>
            <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">
              2. 点注册
            </span>
            <span className="text-zinc-300">→</span>
            <span className="rounded-full bg-purple-100 px-3 py-1 text-purple-700">
              3. fetch POST
            </span>
            <span className="text-zinc-300">→</span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
              4. API Route 接收
            </span>
            <span className="text-zinc-300">→</span>
            <span className="rounded-full bg-pink-100 px-3 py-1 text-pink-700">
              5. 验证数据
            </span>
            <span className="text-zinc-300">→</span>
            <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">
              6. INSERT INTO
            </span>
            <span className="text-zinc-300">→</span>
            <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">
              7. 返回成功
            </span>
          </div>

          <div className="mt-6">
            <h3 className="font-bold text-black">
              测试 API（需要先配好 Supabase + 建好 users 表）
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              users 表需要有 name, email, password, created_at 字段。如果还没有 password 列，在 Supabase SQL Editor 里执行：
            </p>
            <div className="mt-2 rounded-lg bg-zinc-900 p-3 font-mono text-xs text-green-400">
              ALTER TABLE users ADD COLUMN password TEXT;
            </div>

            <div className="mt-4 flex gap-3">
              <Button onClick={testRegisterAPI}>
                发送注册请求（测试API）
              </Button>
              <Button variant="outline" onClick={testValidation}>
                测试验证逻辑（4种错误）
              </Button>
            </div>

            {apiLogs.length > 0 && (
              <div className="mt-4 rounded-lg bg-zinc-900 p-4 font-mono text-sm text-green-400 max-h-80 overflow-auto">
                {apiLogs.map((line, i) => (
                  <div key={i} className={line.startsWith("❌") ? "text-red-400" : ""}>
                    {line.startsWith("✅") ? <span className="text-yellow-300">{line}</span> : line}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ============ 三、数据流示意图 ============ */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">三、数据流的每一步</h2>

          <div className="mt-4 space-y-4">
            <div
              className={`rounded-lg border p-4 cursor-pointer transition-colors ${
                step === 1 ? "border-indigo-300 bg-indigo-50" : "border-zinc-200"
              }`}
              onClick={() => setStep(1)}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                1
              </span>
              <div className="mt-2">
                <strong className="text-sm">受控组件收集表单数据</strong>
                <p className="mt-1 text-xs text-zinc-500">
                  每个 Input 都有 `value={"{"}name{"}"}` 和 `onChange={"{"}(e) =&gt; setName(e.target.value){"}"}` , React 管理所有输入值。点击注册按钮触发 `handleSubmit`。
                </p>
                {step === 1 && (
                  <div className="mt-2 rounded bg-zinc-900 p-2 font-mono text-xs text-green-400">
                    name = &quot;张三&quot;, email = &quot;zs@xx.com&quot;, password = &quot;12345678&quot;
                  </div>
                )}
              </div>
            </div>

            <div
              className={`rounded-lg border p-4 cursor-pointer transition-colors ${
                step === 2 ? "border-indigo-300 bg-indigo-50" : "border-zinc-200"
              }`}
              onClick={() => setStep(2)}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                2
              </span>
              <div className="mt-2">
                <strong className="text-sm">fetch 发送 POST 请求</strong>
                <p className="mt-1 text-xs text-zinc-500">
                  数据被 JSON.stringify 序列化成字符串，通过 HTTP POST 发到 /api/auth/register。
                </p>
                {step === 2 && (
                  <div className="mt-2 rounded bg-zinc-900 p-2 font-mono text-xs text-green-400">
                    {"POST /api/auth/register"}
                    <br />
                    {"Content-Type: application/json"}
                    <br />
                    {"Body: {\"name\":\"张三\",\"email\":\"zs@xx.com\",...}"}
                  </div>
                )}
              </div>
            </div>

            <div
              className={`rounded-lg border p-4 cursor-pointer transition-colors ${
                step === 3 ? "border-indigo-300 bg-indigo-50" : "border-zinc-200"
              }`}
              onClick={() => setStep(3)}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                3
              </span>
              <div className="mt-2">
                <strong className="text-sm">API Route 验证 + 写入 Supabase</strong>
                <p className="mt-1 text-xs text-zinc-500">
                  API 收到请求 → 解析 JSON → 验证字段 → 检查邮箱不重复 → supabase.from(&quot;users&quot;).insert(...) → Supabase 转成 INSERT SQL → PostgreSQL 存储。
                </p>
                {step === 3 && (
                  <div className="mt-2 rounded bg-zinc-900 p-2 font-mono text-xs text-green-400">
                    INSERT INTO users (name, email, password)
                    <br />
                    VALUES (&apos;张三&apos;, &apos;zs@xx.com&apos;, &apos;12345678&apos;);
                  </div>
                )}
              </div>
            </div>

            <div
              className={`rounded-lg border p-4 cursor-pointer transition-colors ${
                step === 4 ? "border-indigo-300 bg-indigo-50" : "border-zinc-200"
              }`}
              onClick={() => setStep(4)}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                4
              </span>
              <div className="mt-2">
                <strong className="text-sm">返回结果 → 页面显示成功</strong>
                <p className="mt-1 text-xs text-zinc-500">
                  API 返回数据 → 前端收到底 → 显示"注册成功"。用户可以去 Supabase 后台确认数据真的在。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============ 四、检验清单 ============ */}
        <section className="rounded-xl border border-green-200 bg-green-50 p-6">
          <h2 className="text-xl font-bold text-green-900">四、今日检验清单</h2>
          <div className="mt-4 space-y-2 text-sm">
            {[
              "能画出「表单 → fetch → API → Supabase → PostgreSQL」的完整流程图",
              "理解 app/api/ 文件夹结构 = URL 路径，导出函数名 = HTTP 方法",
              "注册页的每个 Input 都是受控组件（value + onChange）",
              "打开 /register 填假数据 → 点注册 → 显示注册成功",
              "去 Supabase → Table Editor → users 表 → 数据真的在了！",
              "能解释：为什么 data 出现在数据库里？每一步做了什么？",
            ].map((item, i) => (
              <label key={i} className="flex items-center gap-3 rounded-lg bg-white p-3 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 accent-green-600" />
                <span className="text-zinc-700">{item}</span>
              </label>
            ))}
          </div>

          <div className="mt-4 text-sm">
            完成全部 6 项后 → <strong>恭喜！你第一次打通了全链路。</strong>这是整个学习过程中最重要的里程碑之一。
          </div>
        </section>
      </div>
    </div>
  );
}
