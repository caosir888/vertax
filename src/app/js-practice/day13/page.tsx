"use client";

export default function Day13Page() {
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-black">
            Day 13-14: 第 2 周复习 + "个人备忘录"小项目
          </h1>
          <p className="mt-2 text-zinc-600">
            把第 2 周学的所有知识串联起来——认证 + CRUD + 数据库 + 前后端全链路
          </p>
        </div>

        {/* ============ 一、建表 SQL ============ */}
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-xl font-bold text-amber-900">
            一、前置准备：创建 memos 表
          </h2>
          <p className="mt-1 text-sm text-amber-700">
            在 Supabase → SQL Editor 粘贴以下 SQL → Run
          </p>
          <div className="mt-3 rounded-lg bg-zinc-900 p-4 font-mono text-xs text-green-400">
            <div><span className="text-blue-400">CREATE TABLE</span> memos (</div>
            <div className="pl-4">id <span className="text-purple-400">SERIAL</span> <span className="text-blue-400">PRIMARY KEY</span>,</div>
            <div className="pl-4">user_id <span className="text-purple-400">INTEGER</span> <span className="text-blue-400">NOT NULL</span> <span className="text-blue-400">REFERENCES</span> users(id),</div>
            <div className="pl-4">title <span className="text-purple-400">TEXT</span> <span className="text-blue-400">NOT NULL</span>,</div>
            <div className="pl-4">content <span className="text-purple-400">TEXT</span>,</div>
            <div className="pl-4">created_at <span className="text-purple-400">TIMESTAMPTZ</span> <span className="text-blue-400">DEFAULT NOW</span>()</div>
            <div>);</div>
          </div>

          <p className="mt-3 text-sm text-amber-700">
            关键字段是 <strong>user_id</strong>——它把每条备忘录和创建者关联起来，实现"每个人只能看到自己的数据"。
          </p>
        </section>

        {/* ============ 二、项目架构 ============ */}
        <section className="rounded-xl border border-blue-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">二、备忘录项目的架构</h2>

          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-zinc-200 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-indigo-600">
                <span>📄</span> app/memos/page.tsx
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                前端页面。useEffect 加载数据 → 表单新增 → 按钮删除。受保护路由（未登录跳到 /login）。
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-green-600">
                <span>🔌</span> app/api/memos/route.ts
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                GET：从 JWT 取当前用户 ID → supabase.from(&quot;memos&quot;).select().eq(&quot;user_id&quot;, user.id)<br />
                POST：从 JWT 取当前用户 ID → insert {"{"}user_id, title, content{"}"}
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-red-600">
                <span>🗑</span> app/api/memos/[id]/route.ts
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                DELETE：从 JWT 取当前用户 ID → 先查这条 memo 的 user_id 是不是自己 → 是才删除
              </p>
            </div>

            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-indigo-700">
                <span>🔑</span> 核心知识点：user_id 过滤
              </div>
              <p className="mt-1 text-xs text-indigo-600">
                在多租户系统中，每个用户的数据用 user_id 标记。查询时用 .eq(&quot;user_id&quot;, user.id) 确保只查自己的。
                这就是后续 VertaX 多租户架构的基础——只是把 user_id 换成 tenant_id。
              </p>
            </div>
          </div>
        </section>

        {/* ============ 三、第 2 周知识清单 ============ */}
        <section className="rounded-xl border border-green-200 bg-green-50 p-6">
          <h2 className="text-xl font-bold text-green-900">
            三、第 2 周知识清单——给自己打分（1-5）
          </h2>

          <div className="mt-4 space-y-2 text-sm">
            {[
              { topic: "变量 let/const + 5种数据类型", day: "Day 8" },
              { topic: "函数 function / 箭头函数 / 参数返回值", day: "Day 8" },
              { topic: "if/else 条件判断", day: "Day 8" },
              { topic: "数组方法 map / filter / find / push", day: "Day 9" },
              { topic: "对象操作 keys/values/遍历/展开运算符", day: "Day 9" },
              { topic: "async/await + fetch 请求公开 API", day: "Day 9" },
              { topic: "数据库概念（表/行/列，Excel类比）", day: "Day 10" },
              { topic: "Supabase 注册 + 建表 + supabase-js", day: "Day 10" },
              { topic: "Next.js API Routes（文件夹=路径，导出=方法）", day: "Day 11" },
              { topic: "POST 请求 → API 验证 → 写入数据库", day: "Day 11" },
              { topic: "JWT 概念（Header/Payload/Signature）", day: "Day 12" },
              { topic: "Cookie + middleware 路由保护", day: "Day 12" },
              { topic: "登录/注册/登出 全流程", day: "Day 12" },
              { topic: "user_id 过滤 + 完整 CRUD 小程序", day: "Day 13" },
            ].map((item) => (
              <div key={item.topic} className="rounded-lg bg-white p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400 mr-2">{item.day}</span>
                  <span className="text-zinc-700">{item.topic}</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className="h-4 w-4 rounded border border-green-300 cursor-pointer hover:bg-green-100"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============ 四、M2 里程碑检验 ============ */}
        <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-6">
          <h2 className="text-xl font-bold text-indigo-900">
            四、里程碑 M2 检验清单
          </h2>

          <div className="mt-4 space-y-2 text-sm">
            {[
              "理解 JS 基础（变量、函数、数组、对象、async/await）",
              "能操作数据库（在 Supabase 建表、查数据、插数据）",
              "理解前端 → API → 数据库全链路（能画出流程图）",
              "完成了个人备忘录小项目（登录 → 增删改查 → 只能看自己的）",
              "能独立用 AI 辅助完成一个 CRUD 功能",
            ].map((item, i) => (
              <label key={i} className="flex items-center gap-3 rounded-lg bg-white p-3 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 accent-indigo-600" />
                <span className="text-indigo-900">{item}</span>
              </label>
            ))}
          </div>

          <div className="mt-4 rounded-lg bg-white p-4 text-sm text-indigo-800">
            <strong>完成以上 5 项后 → M2 里程碑达成！</strong> 🎉
            <br />下周进入第 3 周：React 深入 + Next.js 核心。
          </div>
        </section>
      </div>
    </div>
  );
}
