"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export default function Day10Page() {
  // 获取用户列表
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 新增用户表单
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);

  async function fetchUsers() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setUsers(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取失败");
    } finally {
      setLoading(false);
    }
  }

  async function addUser() {
    const name = newName.trim();
    const email = newEmail.trim();
    if (!name || !email) return;

    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setUsers((prev) => [json.data, ...prev]);
      setNewName("");
      setNewEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "添加失败");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-black">
            Day 10: 第一次接触后端——数据库
          </h1>
          <p className="mt-2 text-zinc-600">
            理解数据库 → 注册 Supabase → 建表 → 前端 → API → 数据库全链路
          </p>
        </div>

        {/* ============ 一、什么是数据库 ============ */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">一、什么是数据库？（Excel 类比）</h2>

          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            {/* Excel */}
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <h3 className="font-bold text-green-800">Excel 表格</h3>
              <table className="mt-2 w-full text-xs">
                <thead>
                  <tr className="border-b border-green-300 text-left">
                    <th className="py-1">A(id)</th>
                    <th className="py-1">B(name)</th>
                    <th className="py-1">C(email)</th>
                    <th className="py-1">D(时间)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-zinc-600">
                    <td className="py-0.5">1</td>
                    <td className="py-0.5">张三</td>
                    <td className="py-0.5">zs@xx.com</td>
                    <td className="py-0.5">7/1 10:00</td>
                  </tr>
                  <tr className="text-zinc-600">
                    <td className="py-0.5">2</td>
                    <td className="py-0.5">李四</td>
                    <td className="py-0.5">ls@xx.com</td>
                    <td className="py-0.5">7/1 10:05</td>
                  </tr>
                </tbody>
              </table>
              <ul className="mt-2 space-y-1 text-xs text-green-700">
                <li>• 一个 Excel 文件 = <strong>数据库 (Database)</strong></li>
                <li>• 一个 Sheet 标签页 = <strong>表 (Table)</strong></li>
                <li>
                  • 一行 = <strong>一条数据 (Row/Record)</strong>
                </li>
                <li>
                  • 一列 = <strong>一个字段 (Column/Field)</strong>
                </li>
              </ul>
            </div>

            {/* Database */}
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
              <h3 className="font-bold text-indigo-800">数据库术语</h3>
              <div className="mt-2 space-y-2 text-xs text-indigo-700">
                <div className="rounded bg-white/60 p-2">
                  <strong>Database（数据库）</strong> = 一个项目的数据仓库<br />
                  <span className="text-indigo-400">如：VertaX 的所有数据</span>
                </div>
                <div className="rounded bg-white/60 p-2">
                  <strong>Table（表）</strong> = 存某一类数据的表格<br />
                  <span className="text-indigo-400">如：users 表、products 表</span>
                </div>
                <div className="rounded bg-white/60 p-2">
                  <strong>Row（行）</strong> = 一条具体记录<br />
                  <span className="text-indigo-400">如：张三这个用户的信息</span>
                </div>
                <div className="rounded bg-white/60 p-2">
                  <strong>Column（列）</strong> = 每行的属性<br />
                  <span className="text-indigo-400">如：id, name, email</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-zinc-900 p-4 font-mono text-sm text-green-400">
            <div>
              <span className="text-zinc-500">-- 用 SQL 操作数据库（和操作 Excel 一样的感觉）</span>
            </div>
            <div className="mt-1">
              <span className="text-blue-400">SELECT</span> *{" "}
              <span className="text-blue-400">FROM</span> users;{" "}
              <span className="text-zinc-500">-- 查看全部数据（= 打开 Sheet）</span>
            </div>
            <div>
              <span className="text-blue-400">INSERT INTO</span> users (name, email){" "}
              <span className="text-blue-400">VALUES</span> (&apos;王五&apos;, &apos;ww@xx.com&apos;);
              <span className="text-zinc-500"> -- 新增一行</span>
            </div>
          </div>
        </section>

        {/* ============ 二、Supabase 注册指南 ============ */}
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-xl font-bold text-amber-900">
            二、注册 Supabase（免费云数据库）
          </h2>

          <div className="mt-4 space-y-3 text-sm text-amber-800">
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-700">
                1
              </span>
              <div>
                <strong>打开</strong>{" "}
                <a href="https://supabase.com" target="_blank" className="underline" rel="noreferrer">
                  supabase.com
                </a>{" "}
                → 点 &quot;Start your project&quot; → 用 GitHub 登录
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-700">
                2
              </span>
              <div>
                <strong>创建新项目</strong> → 输入名称（如 vertax）→ 输入密码（记下来！）
                → 选择区域（Singapore 离我们最近）→ 点 &quot;Create project&quot;（等2分钟）
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-700">
                3
              </span>
              <div>
                <strong>获取密钥</strong> → 项目创建好后 → 左侧 Settings → API →
                复制 <code className="rounded bg-amber-200 px-1">Project URL</code> 和{" "}
                <code className="rounded bg-amber-200 px-1">anon public key</code>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-700">
                4
              </span>
              <div>
                <strong>填密钥到 .env.local</strong> → 在项目根目录的 .env.local 文件中填入：
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-lg bg-zinc-900 p-4 font-mono text-xs text-green-400">
            <div>NEXT_PUBLIC_SUPABASE_URL=https://你的项目ID.supabase.co</div>
            <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=你的很长一串anon-key</div>
          </div>

          <div className="mt-4 flex items-start gap-3 text-sm text-amber-800">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-700">
              5
            </span>
            <div>
              <strong>建表</strong> → Supabase 后台 → SQL Editor → 粘贴以下 SQL → 点 Run：
              <div className="mt-2 rounded-lg bg-zinc-900 p-3 font-mono text-xs text-green-400">
                <div>
                  <span className="text-blue-400">CREATE TABLE</span> users (
                </div>
                <div className="pl-4">id <span className="text-purple-400">SERIAL</span>{" "}
                  <span className="text-blue-400">PRIMARY KEY</span>,</div>
                <div className="pl-4">name <span className="text-purple-400">TEXT</span>{" "}
                  <span className="text-blue-400">NOT NULL</span>,</div>
                <div className="pl-4">email <span className="text-purple-400">TEXT</span>{" "}
                  <span className="text-blue-400">NOT NULL UNIQUE</span>,</div>
                <div className="pl-4">password <span className="text-purple-400">TEXT</span>{" "}
                  <span className="text-blue-400">NOT NULL</span>,</div>
                <div className="pl-4">created_at{" "}
                  <span className="text-purple-400">TIMESTAMPTZ</span>{" "}
                  <span className="text-blue-400">DEFAULT NOW</span>()</div>
                <div>);</div>
                <div className="mt-2">
                  <span className="text-zinc-500">-- 插入一条测试数据</span>
                </div>
                <div>
                  <span className="text-blue-400">INSERT INTO</span> users (name, email){" "}
                  <span className="text-blue-400">VALUES</span> (&apos;测试用户&apos;,{" "}
                  &apos;test@example.com&apos;);
                </div>
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm text-amber-700">
            ⚠️ 做完以上步骤后，<strong>重启 dev server</strong>（Ctrl+C 停掉重跑 npm run dev），
            然后回来点下面的按钮测试。
          </p>
        </section>

        {/* ============ 三、前端 → API → 数据库全链路 ============ */}
        <section className="rounded-xl border border-blue-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">
            三、前端 → API → 数据库（全链路实操）
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            下面这个面板就是 &quot;前端 → 发请求 → API 路由 → 读写 Supabase → 返回数据 → 显示在页面&quot; 的完整链路
          </p>

          {/* 链路图 */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium sm:gap-3">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">🖥 浏览器</span>
            <span className="text-zinc-300">→</span>
            <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">fetch()</span>
            <span className="text-zinc-300">→</span>
            <span className="rounded-full bg-purple-100 px-3 py-1 text-purple-700">
              /api/users
            </span>
            <span className="text-zinc-300">→</span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">Supabase</span>
            <span className="text-zinc-300">→</span>
            <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">🗄 PostgreSQL</span>
          </div>

          {/* 代码解释 */}
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 p-3 text-xs">
              <div className="font-bold text-indigo-600">① 前端 (本页面)</div>
              <div className="mt-1 font-mono text-zinc-600">
                <div>fetch(&quot;/api/users&quot;)</div>
                <div className="text-zinc-400">→ 发送请求</div>
                <div>res.json()</div>
                <div className="text-zinc-400">→ 解析返回的数据</div>
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 p-3 text-xs">
              <div className="font-bold text-indigo-600">② API Route</div>
              <div className="mt-1 font-mono text-zinc-600">
                <div>supabase</div>
                <div>.from(&quot;users&quot;)</div>
                <div>.select(&quot;*&quot;)</div>
                <div className="text-zinc-400">→ 查数据库</div>
              </div>
              <div className="mt-1 text-xs text-zinc-400">
                代码在 app/api/users/route.ts
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 p-3 text-xs">
              <div className="font-bold text-indigo-600">③ 数据库</div>
              <div className="mt-1 font-mono text-zinc-600">
                <div>SELECT *</div>
                <div>FROM users</div>
                <div className="text-zinc-400">→ 返回所有用户</div>
              </div>
              <div className="mt-1 text-xs text-zinc-400">
                PostgreSQL (Supabase 托管)
              </div>
            </div>
          </div>

          {/* 操作面板 */}
          <div className="mt-6 border-t border-zinc-200 pt-6">
            <h3 className="font-bold text-black">实操：获取用户列表</h3>
            <div className="mt-3 flex items-center gap-3">
              <Button onClick={fetchUsers} disabled={loading}>
                {loading ? "加载中..." : "从数据库获取用户"}
              </Button>
            </div>

            {error && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error.includes("supabase") || error.includes("URL") || error.includes("key")
                  ? "⚠️ 请先完成上方的 Supabase 配置步骤（注册 → 建表 → 填密钥 → 重启 dev server），然后重试。"
                  : error}
              </div>
            )}

            {/* 用户列表 */}
            {users.length > 0 && (
              <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50">
                    <tr className="text-left text-zinc-500">
                      <th className="px-4 py-2 font-medium">ID</th>
                      <th className="px-4 py-2 font-medium">姓名</th>
                      <th className="px-4 py-2 font-medium">邮箱</th>
                      <th className="px-4 py-2 font-medium">创建时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-t border-zinc-100">
                        <td className="px-4 py-2 text-zinc-400">{u.id}</td>
                        <td className="px-4 py-2 font-medium text-black">{u.name}</td>
                        <td className="px-4 py-2 text-zinc-600">{u.email}</td>
                        <td className="px-4 py-2 text-zinc-400">
                          {new Date(u.created_at).toLocaleString("zh-CN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 空状态 */}
            {!loading && !error && users.length === 0 && (
              <div className="mt-4 rounded-lg border border-dashed border-zinc-300 py-12 text-center text-sm text-zinc-400">
                还没有数据。配置好 Supabase 后，在数据库里 INSERT 一条测试数据，然后点击上方按钮。
              </div>
            )}
          </div>

          {/* 新增表单 */}
          <div className="mt-8 border-t border-zinc-200 pt-6">
            <h3 className="font-bold text-black">新增用户（POST 请求 → 写入数据库）</h3>
            <div className="mt-3 flex flex-wrap gap-3">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="姓名"
                className="max-w-[160px]"
              />
              <Input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="邮箱"
                className="max-w-[240px]"
              />
              <Button onClick={addUser} disabled={adding}>
                {adding ? "添加中..." : "新增用户"}
              </Button>
            </div>
            <p className="mt-2 text-xs text-zinc-400">
              新增成功后会立刻刷新列表。打开 Supabase 后台 → Table Editor，你会看到数据真的在数据库里。
            </p>
          </div>
        </section>

        {/* ============ 四、今日总结 ============ */}
        <section className="rounded-xl border border-green-200 bg-green-50 p-6">
          <h2 className="text-xl font-bold text-green-900">四、今日检验清单</h2>
          <div className="mt-4 space-y-2 text-sm">
            {[
              "能用 Excel 类比解释：数据库、表、行、列分别是什么",
              "注册了 Supabase 账号并创建了项目",
              "在 Supabase 里用 SQL 创建了 users 表",
              "理解了「前端 → fetch → API → Supabase → PostgreSQL」整条链路",
              "页面上能显示从 Supabase 数据库读取的 users 数据",
              "能通过表单新增用户，数据写入了数据库",
            ].map((item, i) => (
              <label
                key={i}
                className="flex items-center gap-3 rounded-lg bg-white p-3 cursor-pointer"
              >
                <input type="checkbox" className="h-4 w-4 accent-green-600" />
                <span className="text-zinc-700">{item}</span>
              </label>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
