"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Memo, ApiResponse, type Role, type Status } from "@/types";

export default function Day18Page() {
  const [showTypes, setShowTypes] = useState(false);

  // TypeScript 演示：类型守卫
  const exampleUser: User = {
    id: "1",
    name: "张三",
    email: "zs@example.com",
    created_at: new Date().toISOString(),
  };

  const exampleMemo: Memo = {
    id: "1",
    user_id: "1",
    team_id: "1",
    title: "学习 TypeScript",
    content: "今天学了 interface 和 type",
    created_at: new Date().toISOString(),
  };

  const roles: Role[] = ["owner", "admin", "editor", "viewer"];
  const statuses: Status[] = ["draft", "review", "published"];

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-black">
            Day 18: 项目结构调整 + TypeScript 基础
          </h1>
          <p className="mt-2 text-zinc-600">
            VertaX 标准架构 + interface / type / 泛型
          </p>
        </div>

        {/* ============ 一、项目结构 ============ */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">
            一、VertaX 标准架构 —— 今天的重构成果
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            使用 Next.js Route Groups（括号文件夹）组织代码，不影响 URL。
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs font-mono">
              <div className="font-bold text-blue-800 mb-2">app/(auth)/</div>
              <div className="text-blue-700">├── login/page.tsx → /login</div>
              <div className="text-blue-700">└── register/page.tsx → /register</div>
              <div className="mt-2 text-blue-500">认证相关页面（公开）</div>
            </div>

            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-xs font-mono">
              <div className="font-bold text-green-800 mb-2">app/(dashboard)/</div>
              <div className="text-green-700">├── layout.tsx ← 共享侧边栏</div>
              <div className="text-green-700">├── dashboard/page.tsx → /dashboard</div>
              <div className="text-green-700">├── memos/page.tsx → /memos</div>
              <div className="text-green-700">├── knowledge/page.tsx → /knowledge</div>
              <div className="text-green-700">├── content/page.tsx → /content</div>
              <div className="text-green-700">├── leads/page.tsx → /leads</div>
              <div className="text-green-700">├── analytics/page.tsx → /analytics</div>
              <div className="text-green-700">└── settings/page.tsx → /settings</div>
              <div className="mt-2 text-green-500">管理后台（受保护）</div>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-zinc-900 p-4 font-mono text-xs text-green-400">
            <div className="text-zinc-500">// Route Group 核心规则</div>
            <div className="text-white">(括号)文件夹名 = 不影响 URL，只用于代码组织</div>
            <div className="mt-1 text-zinc-500">// 同一个 group 里的 layout.tsx 会自动包裹该 group 的所有页面</div>
            <div className="text-white">(dashboard)/layout.tsx → 所有管理后台页面自动有侧边栏</div>
            <div className="mt-1 text-zinc-500">// 不需要在每个页面重复写 sidebar 代码</div>
          </div>
        </section>

        {/* ============ 二、TypeScript 核心 ============ */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">
            二、TypeScript 核心 —— interface / type / 泛型
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            你都用过 interface（Task, User, Memo），现在是系统化理解。
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-sm">
              <strong className="text-purple-800">interface（接口）</strong>
              <p className="mt-1 text-xs text-purple-600">
                定义"对象长什么样"。给组件的 Props 定形状，给 API 返回数据定类型。
              </p>
              <div className="mt-2 rounded bg-white/60 p-2 font-mono text-xs text-purple-800">
                <div><span className="text-blue-600">interface</span> User {"{"}</div>
                <div className="pl-2">id: <span className="text-orange-500">number</span>;</div>
                <div className="pl-2">name: <span className="text-orange-500">string</span>;</div>
                <div className="pl-2">email: <span className="text-orange-500">string</span>;</div>
                <div>{"}"}</div>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
              <strong className="text-amber-800">type（类型别名）</strong>
              <p className="mt-1 text-xs text-amber-600">
                给任意类型起个名字。适合联合类型、函数类型、简单别名。
              </p>
              <div className="mt-2 rounded bg-white/60 p-2 font-mono text-xs text-amber-800">
                <div><span className="text-blue-600">type</span> Role =</div>
                <div className="pl-2"><span className="text-orange-500">"owner"</span> | <span className="text-orange-500">"admin"</span> |</div>
                <div className="pl-2"><span className="text-orange-500">"editor"</span> | <span className="text-orange-500">"viewer"</span>;</div>
                <div className="mt-1"><span className="text-blue-600">type</span> Status =</div>
                <div className="pl-2"><span className="text-orange-500">"draft"</span> | <span className="text-orange-500">"review"</span> | <span className="text-orange-500">"published"</span>;</div>
              </div>
            </div>

            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
              <strong className="text-green-800">泛型 Generic</strong>
              <p className="mt-1 text-xs text-green-600">
                "类型的占位符"。让函数/接口可复用，传什么类型就定什么类型。
              </p>
              <div className="mt-2 rounded bg-white/60 p-2 font-mono text-xs text-green-800">
                <div><span className="text-blue-600">interface</span> ApiResponse&lt;T&gt; {"{"}</div>
                <div className="pl-2">data?: T;</div>
                <div className="pl-2">error?: <span className="text-orange-500">string</span>;</div>
                <div>{"}"}</div>
                <div className="mt-1 text-zinc-500">// 使用:</div>
                <div>ApiResponse&lt;<span className="text-purple-500">User</span>&gt;</div>
                <div>ApiResponse&lt;<span className="text-purple-500">Memo</span>&gt;</div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-zinc-900 p-4 font-mono text-xs text-green-400">
            <div className="text-zinc-500">// 什么时候用 interface？什么时候用 type？</div>
            <div><span className="text-blue-400">interface</span> → 描述对象形状（最常用，你的项目主要用这个）</div>
            <div><span className="text-blue-400">type</span> → 联合类型、交叉类型、简单别名</div>
            <div className="mt-1 text-zinc-500">// 简单判断：对象用 interface，其他用 type</div>
            <div className="text-zinc-500">// 两者大部分情况下可以互换</div>
          </div>
        </section>

        {/* ============ 三、types/index.ts 预览 ============ */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">
            三、统一类型文件 —— src/types/index.ts
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            所有共用的 TypeScript 类型集中在一个文件，各处 import。
          </p>

          <Button variant="outline" onClick={() => setShowTypes(!showTypes)} className="mt-3">
            {showTypes ? "隐藏" : "显示"} src/types/index.ts 内容
          </Button>

          {showTypes && (
            <div className="mt-3 rounded-lg bg-zinc-900 p-4 font-mono text-xs text-green-400 overflow-auto max-h-96">
              <div className="text-zinc-500">// 用户类型</div>
              <div><span className="text-blue-400">export interface</span> User {"{"}</div>
              <div className="pl-3">id: <span className="text-orange-300">number</span>;</div>
              <div className="pl-3">name: <span className="text-orange-300">string</span>;</div>
              <div className="pl-3">email: <span className="text-orange-300">string</span>;</div>
              <div className="pl-3">created_at: <span className="text-orange-300">string</span>;</div>
              <div>{"}"}</div>
              <div className="mt-2 text-zinc-500">// 备忘录类型</div>
              <div><span className="text-blue-400">export interface</span> Memo {"{"}</div>
              <div className="pl-3">id: <span className="text-orange-300">number</span>;</div>
              <div className="pl-3">user_id: <span className="text-orange-300">number</span>;</div>
              <div className="pl-3">title: <span className="text-orange-300">string</span>;</div>
              <div className="pl-3">content: <span className="text-orange-300">string</span>;</div>
              <div className="pl-3">created_at: <span className="text-orange-300">string</span>;</div>
              <div>{"}"}</div>
              <div className="mt-2 text-zinc-500">// API 响应泛型</div>
              <div><span className="text-blue-400">export interface</span> ApiResponse&lt;T&gt; {"{"}</div>
              <div className="pl-3">data?: T;</div>
              <div className="pl-3">error?: <span className="text-orange-300">string</span>;</div>
              <div>{"}"}</div>
              <div className="mt-2 text-zinc-500">// 联合类型</div>
              <div><span className="text-blue-400">export type</span> Role = <span className="text-orange-300">&quot;owner&quot; | &quot;admin&quot; | &quot;editor&quot; | &quot;viewer&quot;</span>;</div>
              <div><span className="text-blue-400">export type</span> Status = <span className="text-orange-300">&quot;draft&quot; | &quot;review&quot; | &quot;published&quot;</span>;</div>
              <div className="mt-2 text-zinc-500">// 用法: import {"{"} User, Memo {"}"} from &quot;@/types&quot;;</div>
            </div>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 p-3 text-xs">
              <strong className="text-indigo-600">使用示例 1：API 函数</strong>
              <div className="mt-1 font-mono text-zinc-600">
                <div>async function <span className="text-yellow-600">fetchUsers</span>() {"{"}</div>
                <div className="pl-2"><span className="text-blue-600">const</span> res = await fetch(&quot;/api/users&quot;);</div>
                <div className="pl-2"><span className="text-blue-600">const</span> json: ApiResponse&lt;User[]&gt; = await res.json();</div>
                <div className="pl-2"><span className="text-blue-600">return</span> json.data;</div>
                <div>{"}"}</div>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 p-3 text-xs">
              <strong className="text-indigo-600">使用示例 2：组件 Props</strong>
              <div className="mt-1 font-mono text-zinc-600">
                <div>function <span className="text-yellow-600">UserCard</span>({"{"} user {"}"}: {"{"} user: User {"}"}) {"{"}</div>
                <div className="pl-2"><span className="text-blue-600">return</span> &lt;div&gt;{"{"}user.name{"}"}&lt;/div&gt;;</div>
                <div>{"}"}</div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ 四、检验清单 ============ */}
        <section className="rounded-xl border border-green-200 bg-green-50 p-6">
          <h2 className="text-xl font-bold text-green-900">四、今日检验清单</h2>
          <div className="mt-4 space-y-2 text-sm">
            {[
              "理解 Route Group（括号文件夹）= 代码分组，不影响 URL",
              "项目结构已按 VertaX 标准架构重组： (auth)/ (dashboard)/",
              "所有管理后台页面共用一个 layout.tsx（侧边栏），不用每个页面重复写",
              "理解 interface 定义对象形状，type 定义类型别名",
              "理解泛型 &lt;T&gt; = 类型占位符（如 ApiResponse&lt;T&gt;）",
              "创建了 src/types/index.ts 统一管理所有类型",
              "打开 /dashboard → 侧边栏有 7 个导航项，点每个都能跳转",
            ].map((item, i) => (
              <label key={i} className="flex items-center gap-3 rounded-lg bg-white p-3 cursor-pointer">
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
