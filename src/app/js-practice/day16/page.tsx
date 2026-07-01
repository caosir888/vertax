"use client";

export default function Day16Page() {
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-black">
            Day 16: Next.js App Router 核心
          </h1>
          <p className="mt-2 text-zinc-600">
            文件约定（page/layout/loading） / 动态路由 [id] / Server vs Client Components
          </p>
        </div>

        {/* ============ 一、文件约定 ============ */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">
            一、App Router 文件约定——文件名即功能
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Next.js 通过文件名自动识别组件角色，不需要手动配置路由。
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm">
              <div className="font-mono font-bold text-blue-800">page.tsx</div>
              <p className="mt-1 text-blue-700">
                页面组件。一个文件夹下只有一个 page.tsx。URL 路径 = 文件夹路径。
              </p>
              <div className="mt-2 font-mono text-xs text-blue-600">
                app/memos/page.tsx → /memos<br />
                app/memos/[id]/page.tsx → /memos/123
              </div>
            </div>

            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
              <div className="font-mono font-bold text-green-800">layout.tsx</div>
              <p className="mt-1 text-green-700">
                布局组件。包裹同目录下的所有页面。导航切换时 layout 不重新渲染。
              </p>
              <div className="mt-2 font-mono text-xs text-green-600">
                根 layout 包裹全站（必有）<br />
                子 layout 包裹某个区域
              </div>
            </div>

            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-sm">
              <div className="font-mono font-bold text-purple-800">loading.tsx</div>
              <p className="mt-1 text-purple-700">
                加载态。页面数据还没准备好时自动显示。本质是 React Suspense。
              </p>
              <div className="mt-2 font-mono text-xs text-purple-600">
                页面加载中 → 自动显示 loading.tsx<br />
                数据就绪 → 自动替换为 page.tsx
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
              <div className="font-mono font-bold text-amber-800">error.tsx / not-found.tsx</div>
              <p className="mt-1 text-amber-700">
                error.tsx：页面出错时显示（&quot;use client&quot; 必须）
                not-found.tsx：404 页面
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-zinc-900 p-4 font-mono text-xs text-green-400">
            <div className="text-zinc-500">// 你的项目结构示例</div>
            <div>app/</div>
            <div>├── <span className="text-yellow-300">layout.tsx</span>         ← 全站布局（导航栏、页脚...）</div>
            <div>├── <span className="text-yellow-300">page.tsx</span>           ← 首页 /</div>
            <div>├── login/</div>
            <div>│   └── <span className="text-yellow-300">page.tsx</span>       ← /login</div>
            <div>├── memos/</div>
            <div>│   ├── <span className="text-yellow-300">page.tsx</span>       ← /memos（备忘录列表）</div>
            <div>│   └── [id]/</div>
            <div>│       ├── <span className="text-yellow-300">page.tsx</span>   ← /memos/123（详情页）</div>
            <div>│       └── <span className="text-yellow-300">loading.tsx</span> ← 详情页加载态</div>
            <div>└── api/</div>
            <div>    └── memos/</div>
            <div>        ├── <span className="text-yellow-300">route.ts</span>   ← GET/POST /api/memos</div>
            <div>        └── [id]/</div>
            <div>            └── <span className="text-yellow-300">route.ts</span> ← GET/DELETE /api/memos/123</div>
          </div>
        </section>

        {/* ============ 二、动态路由 ============ */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">
            二、动态路由 — [id] 匹配任意值
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            文件夹名用方括号包裹 = 动态路由。URL 中的实际值通过 useParams() 或 params prop 读取。
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 p-4 text-sm">
              <strong className="text-indigo-600">服务端组件（Server Component）</strong>
              <div className="mt-2 rounded bg-zinc-900 p-3 font-mono text-xs text-green-400">
                <div><span className="text-blue-400">export default async function</span> Page(</div>
                <div>  {"{"} params {"}"}: {"{"} params: Promise&lt;{"{"} id: string {"}"}&gt; {"}"}</div>
                <div>) {"{"}</div>
                <div className="pl-3">const {"{"} id {"}"} = <span className="text-blue-400">await</span> params;</div>
                <div className="pl-3"><span className="text-zinc-500">// 用 id 查数据库...</span></div>
                <div>{"}"}</div>
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                适用于：数据可以直接在服务端查（不需要客户端交互）
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 p-4 text-sm">
              <strong className="text-indigo-600">客户端组件（Client Component）</strong>
              <div className="mt-2 rounded bg-zinc-900 p-3 font-mono text-xs text-green-400">
                <div><span className="text-zinc-500">// &quot;use client&quot; + useParams()</span></div>
                <div><span className="text-blue-400">const</span> params = <span className="text-yellow-300">useParams</span>();</div>
                <div><span className="text-blue-400">const</span> id = params.id;</div>
                <div className="mt-1"><span className="text-zinc-500">// 然后在 useEffect 里 fetch</span></div>
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                适用于：需要 hooks（useState、useEffect）的交互页面
              </p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-zinc-600">
              <strong>实操验证：</strong>在你的项目中，<code>/memos/123</code>{" "}
              这个 URL 被 <code>app/memos/[id]/page.tsx</code> 匹配，params.id = &quot;123&quot;。
              你可以打开 <a href="/memos" className="text-indigo-600 underline">/memos</a>{" "}
              点击任意备忘录标题，就会跳到详情页。
            </p>
          </div>
        </section>

        {/* ============ 三、Server vs Client Components ============ */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">
            三、Server Component vs Client Component
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            这是 Next.js App Router 最重要的概念。理解了它，你就理解了为什么有时需要 &quot;use client&quot;。
          </p>

          <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="px-4 py-2 text-left font-medium">特性</th>
                  <th className="px-4 py-2 text-left font-medium">
                    Server Component<br /><span className="text-xs text-zinc-400">（默认，不需要声明）</span>
                  </th>
                  <th className="px-4 py-2 text-left font-medium">
                    Client Component<br /><span className="text-xs text-zinc-400">&quot;use client&quot;</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <tr>
                  <td className="px-4 py-2 text-zinc-500">渲染位置</td>
                  <td className="px-4 py-2 text-green-700">服务端（Node.js）</td>
                  <td className="px-4 py-2 text-purple-700">浏览器</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-zinc-500">能用 useState/useEffect？</td>
                  <td className="px-4 py-2 text-red-600">❌ 不能</td>
                  <td className="px-4 py-2 text-green-600">✅ 能</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-zinc-500">能用 onClick/onChange？</td>
                  <td className="px-4 py-2 text-red-600">❌ 不能</td>
                  <td className="px-4 py-2 text-green-600">✅ 能</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-zinc-500">能直接查数据库？</td>
                  <td className="px-4 py-2 text-green-600">✅ 能（async 组件）</td>
                  <td className="px-4 py-2 text-red-600">❌ 不能（需通过 API）</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-zinc-500">JS 体积</td>
                  <td className="px-4 py-2 text-green-700">0 KB（不发到浏览器）</td>
                  <td className="px-4 py-2 text-purple-700">会打包发给浏览器</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-zinc-500">适合场景</td>
                  <td className="px-4 py-2 text-green-700">展示内容、SEO 页面</td>
                  <td className="px-4 py-2 text-purple-700">表单、按钮、交互</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-lg bg-zinc-900 p-4 font-mono text-xs text-green-400">
            <div className="text-zinc-500">// 规则</div>
            <div className="text-white">默认 = Server Component</div>
            <div>&quot;use client&quot; = Client Component</div>
            <div className="mt-2 text-zinc-500">// 实际做法</div>
            <div className="text-white">页面顶层尽量用 Server Component（查数据）</div>
            <div>需要交互的部分提取成 Client Component（加 &quot;use client&quot;）</div>
            <div className="mt-2 text-zinc-500">// 你此前写的所有页面都是 Client Component</div>
            <div className="text-zinc-500">// 因为都需要 useState/useEffect/onClick</div>
            <div className="text-zinc-500">// 后续可以逐步把数据查询层提取成 Server Component</div>
          </div>
        </section>

        {/* ============ 四、动手验证 ============ */}
        <section className="rounded-xl border border-green-200 bg-green-50 p-6">
          <h2 className="text-xl font-bold text-green-900">四、今日检验清单</h2>
          <div className="mt-4 space-y-2 text-sm">
            {[
              "理解 page.tsx / layout.tsx / loading.tsx 三种文件的约定（文件名=功能）",
              "打开 /memos → 点击任意备忘录标题 → 跳转到 /memos/[id] 详情页（动态路由）",
              "在详情页能看到完整内容和创建时间（从 /api/memos/[id] 获取）",
              "在详情页点删除 → 回到列表（删除+导航）",
              "能用自己的话解释 Server Component vs Client Component 的区别",
              "知道什么时候加 'use client'（用了 hooks 或事件回调）",
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
