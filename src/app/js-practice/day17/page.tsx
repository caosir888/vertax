"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Day17Page() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-black">
            Day 17: 响应式布局 + 移动端适配
          </h1>
          <p className="mt-2 text-zinc-600">
            Tailwind 响应式断点 + shadcn/ui Sheet / DropdownMenu / Dialog
          </p>
        </div>

        {/* ============ 一、Tailwind 响应式断点 ============ */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">
            一、Tailwind 响应式前缀 —— 一套代码适配所有屏幕
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            前缀格式：{"{断点}:{类名}"}，只有屏幕宽度 ≥ 断点时才生效。
          </p>

          {/* 实时演示 */}
          <div className="mt-4 space-y-4">
            <div className="rounded-lg bg-red-100 p-4 text-center text-sm sm:bg-amber-100 md:bg-green-100 lg:bg-blue-100 xl:bg-purple-100">
              <strong>拖拽浏览器窗口看颜色变化：</strong>
              <br />
              <span className="text-red-600 sm:hidden">当前: 默认（&lt;640px）— 红色</span>
              <span className="hidden text-amber-600 sm:inline md:hidden">
                当前: sm（≥640px）— 橙色
              </span>
              <span className="hidden text-green-600 md:inline lg:hidden">
                当前: md（≥768px）— 绿色
              </span>
              <span className="hidden text-blue-600 lg:inline xl:hidden">
                当前: lg（≥1024px）— 蓝色
              </span>
              <span className="hidden text-purple-600 xl:inline">
                当前: xl（≥1280px）— 紫色
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 p-4 text-sm">
              <strong className="text-indigo-600">响应式列数</strong>
              <div className="mt-2 grid grid-cols-1 gap-2 text-center text-xs sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded bg-zinc-100 p-2">1</div>
                <div className="rounded bg-zinc-100 p-2">2</div>
                <div className="rounded bg-zinc-100 p-2">3</div>
                <div className="rounded bg-zinc-100 p-2">4</div>
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 p-4 text-sm">
              <strong className="text-indigo-600">响应式显示/隐藏</strong>
              <div className="mt-2 space-y-2 text-xs">
                <div className="rounded bg-green-100 p-2 sm:hidden">
                  📱 只在小屏显示 (sm:hidden)
                </div>
                <div className="rounded bg-blue-100 p-2 hidden sm:block">
                  🖥 只在大屏显示 (hidden sm:block)
                </div>
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                sm:hidden = 小屏隐藏 | hidden sm:flex = 小屏隐藏大屏显示
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-zinc-900 p-4 font-mono text-xs text-green-400">
            <div className="text-zinc-500">// 常见响应式模式</div>
            <div>
              <span className="text-orange-300">className</span>=&quot;grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3&quot;
            </div>
            <div className="text-zinc-500">→ 手机1列 / 平板2列 / 桌面3列</div>
            <div>
              <span className="text-orange-300">className</span>=&quot;text-lg sm:text-xl lg:text-2xl&quot;
            </div>
            <div className="text-zinc-500">→ 屏幕越大字越大</div>
            <div>
              <span className="text-orange-300">className</span>=&quot;px-4 sm:px-6 lg:px-8&quot;
            </div>
            <div className="text-zinc-500">→ 屏幕越大内边距越大</div>
          </div>
        </section>

        {/* ============ 二、三个交互组件 ============ */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">
            二、shadcn/ui 交互组件 —— Sheet / DropdownMenu / Dialog
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            这些组件在仪表盘页面（/dashboard）已有实际应用。下面是独立演示。
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {/* Sheet 演示 */}
            <div className="rounded-lg border border-zinc-200 p-4 text-center">
              <h3 className="text-sm font-bold text-black">Sheet（侧边抽屉）</h3>
              <p className="mt-1 text-xs text-zinc-400">
                从屏幕边缘滑出，适合移动端导航菜单
              </p>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="mt-3">
                    打开 Sheet
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>侧边菜单</SheetTitle>
                    <SheetDescription>
                      移动端导航栏就是这个组件实现的。
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-4 flex flex-col gap-2">
                    <div className="rounded bg-zinc-100 p-2 text-sm">菜单项 1</div>
                    <div className="rounded bg-zinc-100 p-2 text-sm">菜单项 2</div>
                    <div className="rounded bg-zinc-100 p-2 text-sm">菜单项 3</div>
                  </div>
                </SheetContent>
              </Sheet>
              <p className="mt-2 text-xs text-zinc-400">
                side=&quot;left&quot; | &quot;right&quot; | &quot;top&quot; | &quot;bottom&quot;
              </p>
            </div>

            {/* DropdownMenu 演示 */}
            <div className="rounded-lg border border-zinc-200 p-4 text-center">
              <h3 className="text-sm font-bold text-black">DropdownMenu（下拉菜单）</h3>
              <p className="mt-1 text-xs text-zinc-400">
                点击弹出菜单，适合用户头像、操作按钮组
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="mt-3">
                    打开菜单
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-40">
                  <DropdownMenuItem>个人资料</DropdownMenuItem>
                  <DropdownMenuItem>设置</DropdownMenuItem>
                  <DropdownMenuItem>退出登录</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="mt-2 text-xs text-zinc-400">
                DropdownMenuTrigger + DropdownMenuContent
              </p>
            </div>

            {/* Dialog 演示 */}
            <div className="rounded-lg border border-zinc-200 p-4 text-center">
              <h3 className="text-sm font-bold text-black">Dialog（弹窗对话框）</h3>
              <p className="mt-1 text-xs text-zinc-400">
                模态弹窗，适合确认操作、表单填写
              </p>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="mt-3">
                    打开对话框
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>确认删除？</DialogTitle>
                    <DialogDescription>
                      此操作不可撤销。确定要删除这条数据吗？
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                      取消
                    </Button>
                    <Button size="sm" onClick={() => setDialogOpen(false)}>
                      确认删除
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <p className="mt-2 text-xs text-zinc-400">
                DialogTrigger + DialogContent + DialogFooter
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-zinc-900 p-4 font-mono text-xs text-green-400">
            <div className="text-zinc-500">// 安装命令（已在项目中安装）</div>
            <div>npx shadcn@latest add sheet dropdown-menu dialog</div>
            <div className="mt-2 text-zinc-500">// 导入方式</div>
            <div>
              <span className="text-blue-400">import</span> {"{"} Sheet, SheetContent, SheetTrigger {"}"}{" "}
              <span className="text-blue-400">from</span> <span className="text-orange-300">&quot;@/components/ui/sheet&quot;</span>;
            </div>
          </div>
        </section>

        {/* ============ 三、实际应用 ============ */}
        <section className="rounded-xl border border-blue-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">
            三、实际应用：Dashboard 响应式布局
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            打开 /dashboard 页面，缩小浏览器看效果，这是今天最重要的实操成果。
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
              <strong className="text-green-800">桌面端（≥640px）</strong>
              <ul className="mt-2 space-y-1 text-xs text-green-700">
                <li>• 左侧固定侧边栏（w-56）</li>
                <li>• 主内容区 ml-56 让出空间</li>
                <li>• 3列卡片网格</li>
              </ul>
              <p className="mt-2 font-mono text-xs text-green-600">
                className=&quot;hidden sm:flex&quot;
              </p>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
              <strong className="text-amber-800">移动端（&lt;640px）</strong>
              <ul className="mt-2 space-y-1 text-xs text-amber-700">
                <li>• 顶栏 + ☰ 按钮</li>
                <li>• 点 ☰ → Sheet 抽屉菜单</li>
                <li>• 1列卡片网格</li>
              </ul>
              <p className="mt-2 font-mono text-xs text-amber-600">
                className=&quot;sm:hidden&quot;
              </p>
            </div>
          </div>

          <div className="mt-4">
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              去 Dashboard 看效果
            </a>
          </div>
        </section>

        {/* ============ 四、检验清单 ============ */}
        <section className="rounded-xl border border-green-200 bg-green-50 p-6">
          <h2 className="text-xl font-bold text-green-900">四、今日检验清单</h2>
          <div className="mt-4 space-y-2 text-sm">
            {[
              "理解 Tailwind 响应式前缀（sm: md: lg: xl:）的断点值和用法",
              "打开 /dashboard → 缩小浏览器 → 侧边栏变成顶栏+抽屉菜单",
              "桌面端看到固定侧边栏，移动端看到 Sheet 抽屉",
              "理解 Sheet（侧边抽屉）、DropdownMenu（下拉菜单）、Dialog（弹窗）各自的使用场景",
              "能解释 hidden sm:flex（小屏隐藏大屏显示）和 sm:hidden（小屏显示大屏隐藏）的区别",
              "点开上方三个组件的演示，每个都操作一遍",
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
