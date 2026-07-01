"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Day12Page() {
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-black">
            Day 12: 用户认证——JWT + 登录/注册/登出
          </h1>
          <p className="mt-2 text-zinc-600">
            理解 JWT Token → 注册自动登录 → 保护 Dashboard → 登出清除 Token
          </p>
        </div>

        {/* ============ 一、什么是 JWT ============ */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">
            一、什么是 JWT？（JSON Web Token）
          </h2>

          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
            <strong className="text-amber-800">用"游乐园手环"来理解：</strong>
            <ul className="mt-2 space-y-1 text-amber-700">
              <li>• 你买票入园（登录），工作人员给你一个手环（JWT Token）</li>
              <li>• 手环上有你的信息和过期时间，盖了章（签名）</li>
              <li>• 你去任何游乐设施（访问 Dashboard），出示手环就行，不用每次掏身份证</li>
              <li>• 手环过期了（Token 过期），需要重新买票（重新登录）</li>
              <li>• 手环上的章是你自己盖不了的（签名防伪造）</li>
            </ul>
          </div>

          <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 p-3">
              <strong className="text-indigo-600">Header（头部）</strong>
              <p className="mt-1 text-zinc-500">算法 + 类型：{`{alg: "HS256", typ: "JWT"}`}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-3">
              <strong className="text-indigo-600">Payload（载荷）</strong>
              <p className="mt-1 text-zinc-500">存用户信息：{`{id, name, email}`}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-3">
              <strong className="text-indigo-600">Signature（签名）</strong>
              <p className="mt-1 text-zinc-500">用密钥加密，防止篡改</p>
            </div>
          </div>

          <div className="mt-3 rounded-lg bg-zinc-900 p-4 font-mono text-xs text-green-400 break-all">
            eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwibmFtZSI6IuW8oOS4iSJ9.xK3...
            <br />
            <span className="text-zinc-500">Header.Payload.Signature → 三段式，用点分隔</span>
          </div>
        </section>

        {/* ============ 二、全链路流程 ============ */}
        <section className="rounded-xl border border-blue-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">
            二、认证全链路（注册 → 自动登录 → Dashboard → 登出）
          </h2>

          <div className="mt-4 space-y-4">
            <div
              className={`rounded-lg border p-4 cursor-pointer transition-colors ${
                step === 1 ? "border-indigo-300 bg-indigo-50" : "border-zinc-200"
              }`}
              onClick={() => setStep(1)}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">1</span>
              <div className="mt-2">
                <strong className="text-sm">注册 → 自动登录</strong>
                <p className="mt-1 text-xs text-zinc-500">
                  填表 → POST /api/auth/register → API 验证并 INSERT → API 生成 JWT → 设置 Cookie → 返回成功 → 前端跳转 /dashboard
                </p>
              </div>
            </div>

            <div
              className={`rounded-lg border p-4 cursor-pointer transition-colors ${
                step === 2 ? "border-indigo-300 bg-indigo-50" : "border-zinc-200"
              }`}
              onClick={() => setStep(2)}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">2</span>
              <div className="mt-2">
                <strong className="text-sm">访问受保护页面</strong>
                <p className="mt-1 text-xs text-zinc-500">
                  浏览器访问 /dashboard → middleware.ts 拦截 → 读取 Cookie 中的 JWT → 验证签名 → 通过则放行，失败则重定向到 /login
                </p>
              </div>
            </div>

            <div
              className={`rounded-lg border p-4 cursor-pointer transition-colors ${
                step === 3 ? "border-indigo-300 bg-indigo-50" : "border-zinc-200"
              }`}
              onClick={() => setStep(3)}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">3</span>
              <div className="mt-2">
                <strong className="text-sm">登录页</strong>
                <p className="mt-1 text-xs text-zinc-500">
                  输入邮箱密码 → POST /api/auth/login → API 查库验证 → 匹配则生成 JWT → 设置 Cookie → 前端跳转 /dashboard
                </p>
              </div>
            </div>

            <div
              className={`rounded-lg border p-4 cursor-pointer transition-colors ${
                step === 4 ? "border-indigo-300 bg-indigo-50" : "border-zinc-200"
              }`}
              onClick={() => setStep(4)}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">4</span>
              <div className="mt-2">
                <strong className="text-sm">登出</strong>
                <p className="mt-1 text-xs text-zinc-500">
                  点退出登录 → POST /api/auth/logout → API 清除 Cookie → 前端跳转到 /login
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============ 三、关键代码 ============ */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">三、新增的关键文件</h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 p-3 text-xs">
              <div className="font-mono font-bold text-purple-700">src/lib/auth.ts</div>
              <p className="mt-1 text-zinc-500">
                JWT 工具函数：createToken（生成）/ verifyToken（验证）/ getSession（读当前用户）/ setSessionCookie / clearSessionCookie
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-3 text-xs">
              <div className="font-mono font-bold text-purple-700">src/middleware.ts</div>
              <p className="mt-1 text-zinc-500">
                请求拦截器。检查 /dashboard 路径 → 从 Cookie 中取 JWT → 验证 → 放行或重定向到 /login
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-3 text-xs">
              <div className="font-mono font-bold text-purple-700">api/auth/login/route.ts</div>
              <p className="mt-1 text-zinc-500">
                登录 API。接收邮箱+密码 → 查数据库 → 匹配则生成 JWT → 写入 Cookie
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-3 text-xs">
              <div className="font-mono font-bold text-purple-700">api/auth/me/route.ts</div>
              <p className="mt-1 text-zinc-500">
                "我是谁"API。前端调用此接口 → 从 Cookie 解析 JWT → 返回当前用户信息
              </p>
            </div>
          </div>
        </section>

        {/* ============ 四、测试验证 ============ */}
        <section className="rounded-xl border border-green-200 bg-green-50 p-6">
          <h2 className="text-xl font-bold text-green-900">四、今日检验清单</h2>

          <div className="mt-4 space-y-2 text-sm">
            {[
              "能用自己的话解释 JWT 是什么（游乐园手环比喻）",
              "打开浏览器无痕模式 → 访问 /dashboard → 被重定向到 /login（因为没有登录）",
              "打开 /register → 注册新用户 → 自动跳转到 /dashboard（注册即登录）",
              "在 /dashboard 能看到自己的名字和邮箱（从 JWT 解析出来）",
              "点退出登录 → 跳转到 /login → 再访问 /dashboard → 又被重定向（登出成功）",
              "打开 /login → 用刚才注册的邮箱密码登录 → 成功进入 /dashboard",
            ].map((item, i) => (
              <label key={i} className="flex items-center gap-3 rounded-lg bg-white p-3 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 accent-green-600" />
                <span className="text-zinc-700">{item}</span>
              </label>
            ))}
          </div>

          <div className="mt-4 rounded-lg bg-white p-4 text-sm text-zinc-700">
            <strong>完整测试流程：</strong>
            <ol className="mt-2 list-decimal pl-5 space-y-1 text-xs text-zinc-600">
              <li>浏览器开无痕模式（Ctrl+Shift+N）</li>
              <li>访问 localhost:3000/dashboard → 自动跳到 /login ✓</li>
              <li>点"立即注册"→ 填写表单 → 注册 → 自动跳到 /dashboard ✓</li>
              <li>点"退出登录"→ 跳转到 /login ✓</li>
              <li>输入刚才的邮箱密码 → 点登录 → 进入 /dashboard ✓</li>
              <li>去 Supabase → Table Editor → users 表 → 用户数据都在 ✓</li>
            </ol>
          </div>

          <div className="mt-4 text-sm font-bold text-green-900">
            完成全部 6 项后 → 恭喜！注册/登录/鉴权/登出 全链路打通。这是 M2 里程碑的核心。
          </div>
        </section>
      </div>
    </div>
  );
}
