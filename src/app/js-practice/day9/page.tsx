"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ========== Console 模拟器组件（复用 Day 8 的） ==========

function ConsoleOutput({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <div className="mt-3 rounded-lg bg-zinc-900 p-4 font-mono text-sm text-green-400 max-h-60 overflow-auto">
      {lines.map((line, i) => (
        <div key={i}>
          <span className="text-zinc-500">&gt; </span>
          {line}
        </div>
      ))}
    </div>
  );
}

// ========== 用户数据类型 ==========

interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

// ========== 主页面 ==========

export default function Day9Page() {
  const [output, setOutput] = useState<string[]>([]);

  function run(fn: () => void) {
    setOutput([]);
    const logs: string[] = [];
    const orig = console.log;
    console.log = (...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
    };
    fn();
    console.log = orig;
    setOutput(logs);
  }

  // ==================== 一、数组方法 ====================

  function demoMap() {
    const nums = [1, 2, 3, 4, 5];
    console.log("原数组:", nums);
    console.log("×2:", nums.map((n) => n * 2));
    console.log("→ map: 遍历每个元素，返回一个新数组，原数组不变");
  }

  function demoFilter() {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8];
    console.log("原数组:", nums);
    console.log("偶数:", nums.filter((n) => n % 2 === 0));
    console.log(">4:", nums.filter((n) => n > 4));
    console.log("→ filter: 筛选符合条件的元素，返回新数组");
  }

  function demoFind() {
    const users = [
      { name: "张三", age: 20 },
      { name: "李四", age: 25 },
      { name: "王五", age: 30 },
    ];
    console.log("用户列表:", users);
    console.log("找王五:", users.find((u) => u.name === "王五"));
    console.log("找年龄>22的:", users.find((u) => u.age > 22));
    console.log("→ find: 返回第一个符合条件的元素（不是数组）");
  }

  function demoPush() {
    const arr: string[] = [];
    console.log("初始:", arr);
    arr.push("苹果");
    console.log("push苹果:", arr);
    arr.push("香蕉", "橘子");
    console.log("push香蕉橘子:", arr);
    console.log("→ push: 向数组末尾添加元素，会修改原数组");
  }

  function demoArrayAll() {
    const todos = [
      { task: "学JS", done: true },
      { task: "学React", done: false },
      { task: "学Next.js", done: false },
      { task: "部署项目", done: false },
    ];
    console.log("任务列表:", todos);
    console.log("---");
    console.log("map - 提取task名:", todos.map((t) => t.task));
    console.log("filter - 已完成:", todos.filter((t) => t.done));
    console.log("filter - 未完成:", todos.filter((t) => !t.done));
    console.log("find - 找学React:", todos.find((t) => t.task === "学React"));
  }

  // ==================== 二、对象操作 ====================

  function demoObjectKeys() {
    const user = { name: "张三", age: 25, email: "zs@example.com" };
    console.log("对象:", user);
    console.log("键名:", Object.keys(user));
    console.log("值:", Object.values(user));
    console.log("键值对:", Object.entries(user));
  }

  function demoObjectLoop() {
    const user = { name: "张三", age: 25, email: "zs@example.com" };
    console.log("遍历对象:");
    for (const key of Object.keys(user)) {
      console.log(`  ${key} = ${user[key as keyof typeof user]}`);
    }
  }

  function demoObjectSpread() {
    const user = { name: "张三", age: 25 };
    console.log("原始:", user);
    const updated = { ...user, age: 26, city: "北京" };
    console.log("展开+修改age+加city:", updated);
    console.log("原对象不受影响:", user);
  }

  // ==================== 三、async/await + fetch ====================

  // ----- 从 JSONPlaceholder 获取数据 -----

  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState("");

  async function fetchPosts() {
    setPostsLoading(true);
    setPostsError("");
    setPosts([]);

    try {
      console.log("发送请求到 JSONPlaceholder...");
      const response = await fetch(
        "https://jsonplaceholder.typicode.com/posts?_limit=10"
      );
      console.log("响应状态:", response.status);

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const data: Post[] = await response.json();
      console.log(`获取到 ${data.length} 条数据`);
      console.log("第一条:", data[0]);
      setPosts(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "未知错误";
      console.log("❌ " + message);
      setPostsError(message);
    } finally {
      setPostsLoading(false);
    }
  }

  // 页面加载时自动请求一次
  useEffect(() => {
    fetchPosts();
  }, []);

  // ==================== 习题 ====================

  function runExercises() {
    console.log("=== 题1: map ===");
    const prices = [100, 200, 300];
    console.log("原价:", prices);
    console.log("打8折:", prices.map((p) => p * 0.8));

    console.log("=== 题2: filter ===");
    const ages = [12, 18, 25, 16, 30];
    console.log("年龄:", ages);
    console.log("成年(>=18):", ages.filter((a) => a >= 18));

    console.log("=== 题3: find ===");
    const products = [
      { name: "手机", price: 5999 },
      { name: "电脑", price: 8999 },
      { name: "耳机", price: 999 },
    ];
    console.log("找耳机:", products.find((p) => p.name === "耳机"));

    console.log("=== 题4: 对象操作 ===");
    const car = { brand: "Toyota", model: "Camry", year: 2020 };
    console.log("原始:", car);
    const newCar = { ...car, year: 2024 };
    console.log("更新year:", newCar);

    console.log("=== 题5: async/await ===");
    console.log("（见下方 fetch 示例 ↑）");
  }

  // ==================== 页面 UI ====================

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-black">
            Day 9: JavaScript 核心概念（下）
          </h1>
          <p className="mt-2 text-zinc-600">
            数组方法 → 对象操作 → async/await + fetch 从真实 API 获取数据
          </p>
        </div>

        {/* ============ 一、数组方法 ============ */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">一、数组方法</h2>
          <p className="mt-1 text-sm text-zinc-500">
            map（变换）、filter（筛选）、find（查找）、push（添加）
          </p>

          {/* 概念卡片 */}
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 p-3">
              <code className="font-bold text-indigo-600">.map()</code>
              <p className="mt-1 text-zinc-500">
                遍历每个元素，返回<strong>新数组</strong>。每个元素都会经过回调函数处理。
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                [1,2,3].map(n → n×2) → [2,4,6]
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-3">
              <code className="font-bold text-indigo-600">.filter()</code>
              <p className="mt-1 text-zinc-500">
                筛选符合条件的元素，返回<strong>新数组</strong>。回调返回 true 就保留。
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                [1,2,3,4].filter(n → n&gt;2) → [3,4]
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-3">
              <code className="font-bold text-indigo-600">.find()</code>
              <p className="mt-1 text-zinc-500">
                返回<strong>第一个</strong>符合条件的元素（不是数组）。
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                [1,2,3].find(n → n&gt;1) → 2
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-3">
              <code className="font-bold text-indigo-600">.push()</code>
              <p className="mt-1 text-zinc-500">
                向数组末尾添加元素，<strong>修改原数组</strong>。
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                arr.push(4) → arr变成[1,2,3,4]
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button variant="outline" onClick={() => run(demoMap)}>
              .map() 示例
            </Button>
            <Button variant="outline" onClick={() => run(demoFilter)}>
              .filter() 示例
            </Button>
            <Button variant="outline" onClick={() => run(demoFind)}>
              .find() 示例
            </Button>
            <Button variant="outline" onClick={() => run(demoPush)}>
              .push() 示例
            </Button>
            <Button
              variant="outline"
              className="sm:col-span-2"
              onClick={() => run(demoArrayAll)}
            >
              综合示例：Todo列表操作
            </Button>
          </div>

          <ConsoleOutput lines={output} />
        </section>

        {/* ============ 二、对象操作 ============ */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">二、对象操作</h2>
          <p className="mt-1 text-sm text-zinc-500">
            读取属性 / 修改属性 / 展开运算符 / 遍历
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Button variant="outline" onClick={() => run(demoObjectKeys)}>
              keys/values/entries
            </Button>
            <Button variant="outline" onClick={() => run(demoObjectLoop)}>
              遍历对象
            </Button>
            <Button variant="outline" onClick={() => run(demoObjectSpread)}>
              展开运算符 ...obj
            </Button>
          </div>

          <ConsoleOutput lines={output} />
        </section>

        {/* ============ 三、async/await + fetch ============ */}
        <section className="rounded-xl border border-blue-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">三、async/await + fetch</h2>
          <p className="mt-1 text-sm text-zinc-500">
            从 JSONPlaceholder（免费测试 API）获取真实数据并显示在页面上
          </p>

          {/* 代码讲解 */}
          <div className="mt-4 rounded-lg bg-zinc-900 p-4 font-mono text-xs text-green-400 leading-relaxed">
            <div>
              <span className="text-purple-400">async</span>{" "}
              <span className="text-blue-400">function</span>{" "}
              <span className="text-yellow-300">fetchPosts</span>() {"{"}
            </div>
            <div className="pl-4">
              <span className="text-zinc-500">// 1. await 等待网络请求完成</span>
            </div>
            <div className="pl-4">
              <span className="text-blue-400">const</span> res ={" "}
              <span className="text-blue-400">await</span>{" "}
              <span className="text-yellow-300">fetch</span>(<span className="text-orange-300">
                "https://jsonplaceholder.typicode.com/posts"
              </span>);
            </div>
            <div className="pl-4">
              <span className="text-zinc-500">// 2. 把响应转成 JSON</span>
            </div>
            <div className="pl-4">
              <span className="text-blue-400">const</span> data ={" "}
              <span className="text-blue-400">await</span> res.
              <span className="text-yellow-300">json</span>();
            </div>
            <div className="pl-4">
              <span className="text-zinc-500">// 3. data 就是后端返回的数据</span>
            </div>
            <div className="pl-4">console.log(data);</div>
            <div>{"}"}</div>
          </div>

          <p className="mt-3 text-sm text-zinc-600">
            <strong>核心理解：</strong>
            <code className="rounded bg-zinc-100 px-1">async</code>{" "}
            标记函数里面有异步操作（需要等待），
            <code className="rounded bg-zinc-100 px-1">await</code>{" "}
            等一个 Promise 完成再继续往下走。
            用"点餐"来理解：你点了菜（fetch），然后等着上菜（await），菜上来了再吃（用数据）。
          </p>

          {/* 加载按钮 */}
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={fetchPosts} disabled={postsLoading}>
              {postsLoading ? "加载中..." : "重新获取数据"}
            </Button>
            <span className="text-xs text-zinc-400">
              数据来源: JSONPlaceholder API（假数据，共100条）
            </span>
          </div>

          {postsError && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {postsError}
            </div>
          )}

          {/* 数据展示 */}
          {posts.length > 0 && (
            <div className="mt-4 space-y-3">
              <p className="text-sm font-medium text-zinc-700">
                已获取 {posts.length} 条数据：
              </p>
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-lg border border-zinc-200 p-4 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                      {post.id}
                    </span>
                    <span className="text-xs text-zinc-400">
                      用户 #{post.userId}
                    </span>
                  </div>
                  <h3 className="mt-1 font-medium text-black capitalize">
                    {post.title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">{post.body}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ============ 四、今日习题 ============ */}
        <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-6">
          <h2 className="text-xl font-bold text-indigo-900">
            四、5 道练习题（控制台 F12 → Console）
          </h2>

          <ol className="mt-4 space-y-4 text-sm text-zinc-700">
            <li className="rounded-lg border border-indigo-200 bg-white p-3">
              <strong>题1 map：</strong>
              给定 <code>prices = [100, 200, 300]</code>，
              用 <code>.map()</code> 把每个价格打八折，打印新数组
            </li>
            <li className="rounded-lg border border-indigo-200 bg-white p-3">
              <strong>题2 filter：</strong>
              给定 <code>ages = [12, 18, 25, 16, 30]</code>，
              用 <code>.filter()</code> 筛选出成年人（≥18），打印结果
            </li>
            <li className="rounded-lg border border-indigo-200 bg-white p-3">
              <strong>题3 find：</strong>
              给定{" "}
              <code>
                products = [{"{"}name:&quot;手机&quot;, price:5999{"}"}, ...]
              </code>，
              用 <code>.find()</code> 找到 name 为"耳机"的对象
            </li>
            <li className="rounded-lg border border-indigo-200 bg-white p-3">
              <strong>题4 对象展开：</strong>
              给定 <code>car = {"{"}brand:&quot;Toyota&quot;, year:2020{"}"}</code>，
              用展开运算符创建一个新对象，把 year 改成 2024
            </li>
            <li className="rounded-lg border border-indigo-200 bg-white p-3">
              <strong>题5 async/await：</strong>
              用 fetch 请求{" "}
              <code>https://jsonplaceholder.typicode.com/users</code>，
              用 <code>console.log</code> 打印所有用户的名字
            </li>
          </ol>

          <div className="mt-4">
            <Button onClick={() => run(runExercises)} variant="default">
              在控制台查看参考答案
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
