"use client";

export default function Day19Page() {
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-black">
            Day 19: 部署到 Vercel —— 让你的应用上线
          </h1>
          <p className="mt-2 text-zinc-600">
            关联 GitHub → 自动部署 → 配置环境变量 → 线上全流程测试
          </p>
        </div>

        {/* ============ 一、什么是部署 ============ */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">一、什么是部署？Vercel 是什么？</h2>

          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm">
              <strong className="text-blue-800">本地开发 vs 线上部署</strong>
              <p className="mt-1 text-blue-700">
                到目前为止你的所有代码都跑在 localhost:3000，只有你自己能看到。
                部署 = 把你的代码放到一台公网服务器上运行，任何人通过 URL 都能访问。
              </p>
            </div>

            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
              <strong className="text-green-800">Vercel 是什么？</strong>
              <ul className="mt-1 space-y-1 text-green-700 text-xs">
                <li>• Vercel 是 Next.js 的官方部署平台（同一个团队做的）</li>
                <li>• 关联 GitHub 仓库 → 代码 push → 自动部署（不用手动操作）</li>
                <li>• 免费额度：个人项目完全够用</li>
                <li>• 自动 HTTPS、全球 CDN、预览部署（每个 PR 一个临时 URL）</li>
              </ul>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
              <strong className="text-amber-800">部署流程（5 步，约 15 分钟）</strong>
              <ol className="mt-1 space-y-1 text-amber-700 text-xs list-decimal list-inside">
                <li>先把代码 push 到 GitHub</li>
                <li>打开 vercel.com，用 GitHub 登录</li>
                <li>点 "Import Project" → 选择 vertax 仓库</li>
                <li>配置环境变量（Supabase + JWT 密钥）</li>
                <li>点 Deploy → 等 2 分钟 → 拿到 URL</li>
              </ol>
            </div>
          </div>
        </section>

        {/* ============ 二、部署步骤 ============ */}
        <section className="rounded-xl border border-blue-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">二、详细步骤（跟着做）</h2>

          <div className="mt-4 space-y-6">
            {/* Step 1 */}
            <div className="rounded-lg border border-zinc-200 p-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                1
              </span>
              <div className="mt-2">
                <strong className="text-sm">Push 代码到 GitHub</strong>
                <p className="mt-1 text-xs text-zinc-500">
                  确保所有代码都在 GitHub 上。Vercel 从 GitHub 拉代码，不是从你电脑上传。
                </p>
                <div className="mt-2 rounded bg-zinc-900 p-3 font-mono text-xs text-green-400">
                  <div>git add -A</div>
                  <div>git commit -m &quot;Day1-18: 项目架构重组 + 认证/备忘录/响应式布局&quot;</div>
                  <div>git push origin master</div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-lg border border-zinc-200 p-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                2
              </span>
              <div className="mt-2">
                <strong className="text-sm">打开 Vercel → Import 仓库</strong>
                <p className="mt-1 text-xs text-zinc-500">
                  打开{" "}
                  <a href="https://vercel.com" target="_blank" className="underline text-indigo-600" rel="noreferrer">
                    vercel.com
                  </a>{" "}
                  → 用 GitHub 登录 → 点 &quot;Add New...&quot; → &quot;Project&quot; →
                  在列表里找到 &quot;vertax&quot; → 点 Import
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-lg border border-zinc-200 p-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                3
              </span>
              <div className="mt-2">
                <strong className="text-sm">配置环境变量（重要！漏了这个会报错）</strong>
                <p className="mt-1 text-xs text-zinc-500">
                  在 Vercel 的项目设置页面，找到 Environment Variables，添加以下三个：
                </p>
                <div className="mt-2 overflow-hidden rounded-lg border border-zinc-200">
                  <table className="w-full text-xs">
                    <thead className="bg-zinc-50">
                      <tr>
                        <th className="px-3 py-1.5 text-left font-medium">变量名</th>
                        <th className="px-3 py-1.5 text-left font-medium">值</th>
                        <th className="px-3 py-1.5 text-left font-medium">从哪里获取</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      <tr>
                        <td className="px-3 py-1.5 font-mono text-purple-600">
                          NEXT_PUBLIC_SUPABASE_URL
                        </td>
                        <td className="px-3 py-1.5 text-zinc-500">https://xxx.supabase.co</td>
                        <td className="px-3 py-1.5 text-zinc-400">
                          Supabase → Settings → API → Project URL
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-mono text-purple-600">
                          NEXT_PUBLIC_SUPABASE_ANON_KEY
                        </td>
                        <td className="px-3 py-1.5 text-zinc-500">eyJhbG...</td>
                        <td className="px-3 py-1.5 text-zinc-400">
                          Supabase → Settings → API → anon public key
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-mono text-purple-600">
                          JWT_SECRET
                        </td>
                        <td className="px-3 py-1.5 text-zinc-500">
                          一串随机字符
                        </td>
                        <td className="px-3 py-1.5 text-zinc-400">
                          自己生成（建议 32 位以上，不要用 dev-secret）
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-xs text-amber-600">
                  ⚠️ 变量名必须一模一样，区分大小写。值从 Supabase 后台复制，不要有多余空格。
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="rounded-lg border border-zinc-200 p-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                4
              </span>
              <div className="mt-2">
                <strong className="text-sm">Deploy!</strong>
                <p className="mt-1 text-xs text-zinc-500">
                  框架自动识别 Next.js，不需要改任何构建设置。直接点 &quot;Deploy&quot;，
                  等 2-3 分钟，Vercel 会自动构建并部署。
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  （如果构建失败，看错误日志。最常见原因：环境变量没配或值不对。）
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="rounded-lg border border-zinc-200 p-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                5
              </span>
              <div className="mt-2">
                <strong className="text-sm">拿到 URL → 测试全流程</strong>
                <p className="mt-1 text-xs text-zinc-500">
                  部署成功后，你会得到一个类似{" "}
                  <code className="rounded bg-zinc-100 px-1">https://vertax-xxx.vercel.app</code>{" "}
                  的 URL。用手机或朋友的电脑打开这个链接，测试：
                </p>
                <ul className="mt-2 space-y-1 text-xs text-zinc-600 list-disc list-inside">
                  <li>打开首页 → 能看到 VertaX 标题</li>
                  <li>访问 /login → 看到登录页</li>
                  <li>访问 /register → 注册一个新用户 → 自动跳转 Dashboard</li>
                  <li>访问 /memos → 新增 + 查看 + 删除备忘录</li>
                  <li>退出登录 → 再访问 /dashboard → 跳转到 /login</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ============ 三、运维常识 ============ */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">三、部署后的运维常识</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
              <strong className="text-green-800">自动部署</strong>
              <p className="mt-1 text-xs text-green-700">
                之后每次 git push 到 master，Vercel 会自动重新部署。
                你不需要手动操作。改代码 → push → 等 2 分钟 → 线上自动更新。
              </p>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
              <strong className="text-amber-800">预览部署</strong>
              <p className="mt-1 text-xs text-amber-700">
                每个 PR 都会自动生成一个临时 URL（如 vertax-git-feat-xxx.vercel.app）。
                可以在合并前预览改动，不影响线上版本。
              </p>
            </div>

            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-sm">
              <strong className="text-purple-800">环境变量</strong>
              <p className="mt-1 text-xs text-purple-700">
                生产环境用 Vercel 的环境变量。
                开发环境用 .env.local。
                <strong>永远不要把 .env.local 提交到 Git。</strong>
              </p>
            </div>
          </div>
        </section>

        {/* ============ 四、检验清单 ============ */}
        <section className="rounded-xl border border-green-200 bg-green-50 p-6">
          <h2 className="text-xl font-bold text-green-900">四、今日检验清单</h2>
          <div className="mt-4 space-y-2 text-sm">
            {[
              "代码已 push 到 GitHub（git push origin master）",
              "Vercel 已成功导入 vertax 仓库",
              "三个环境变量已正确配置（SUPABASE_URL + ANON_KEY + JWT_SECRET）",
              "部署成功，拿到公网 URL（如 vertax-xxx.vercel.app）",
              "在手机上/朋友电脑上打开 URL，看到首页",
              "注册一个新用户 → 能登录 → 能增删备忘录 → 能退出",
              "线上数据和本地数据在同一条 Supabase 数据库（因为用的是同一个 Supabase 项目）",
            ].map((item, i) => (
              <label key={i} className="flex items-center gap-3 rounded-lg bg-white p-3 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 accent-green-600" />
                <span className="text-zinc-700">{item}</span>
              </label>
            ))}
          </div>

          <div className="mt-4 rounded-lg bg-white p-4 text-sm text-zinc-700">
            <strong>提醒：</strong>
            部署成功后，你的 .env.local 里配的 Supabase 密钥和线上用的是同一套。
            这意味着：本地开发时注册的用户 → 线上也能登录！本地和线上共享同一个 Supabase 数据库。
          </div>
        </section>
      </div>
    </div>
  );
}
