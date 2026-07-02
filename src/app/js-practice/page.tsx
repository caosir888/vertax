"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function ConsoleOutput({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <div className="mt-3 rounded-lg bg-zinc-900 p-4 font-mono text-sm text-green-400">
      {lines.map((line, i) => (
        <div key={i}>
          <span className="text-zinc-500">&gt; </span>
          {line}
        </div>
      ))}
    </div>
  );
}

export default function JsPracticePage() {
  const [output, setOutput] = useState<string[]>([]);
  const [nameInput, setNameInput] = useState("");
  const [scoreInput, setScoreInput] = useState("");

  function run(code: () => void) {
    setOutput([]);
    const logs: string[] = [];
    const orig = console.log;
    console.log = (...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
    };
    code();
    console.log = orig;
    setOutput(logs);
  }

  function addLine(text: string) {
    setOutput((prev) => [...prev, text]);
  }

  // ========== Section 1 helpers ==========

  function demoVariables() {
    let name: string = "张三";
    const age: number = 25;
    console.log("姓名:", name, "| 年龄:", age);
    name = "李四";
    console.log("改名后:", name);
    console.log("---");
    console.log("✅ let 可以改, const 不能改");
  }

  function demoString() {
    const s1 = "hello";
    const s2 = "你好，世界";
    console.log(s1, "|", s2);
    console.log("拼接:", s1 + " " + s2);
    console.log("长度:", s2.length);
    console.log("大写:", s1.toUpperCase());
  }

  function demoNumber() {
    const a = 10;
    const b = 3;
    console.log("加减乘除:");
    console.log(a + "+" + b + "=", a + b);
    console.log(a + "-" + b + "=", a - b);
    console.log(a + "×" + b + "=", a * b);
    console.log(a + "÷" + b + "=", a / b);
    console.log("取余:", a % b);
  }

  function demoBoolean() {
    const isLoggedIn = true;
    const hasPermission = false;
    console.log("已登录:", isLoggedIn);
    console.log("有权限:", hasPermission);
    console.log("比较: 10 > 5 =", 10 > 5);
    console.log("比较: 10 === 5 =", (10 as number) === (5 as number));
    console.log("且运算:", isLoggedIn && hasPermission);
    console.log("或运算:", isLoggedIn || hasPermission);
  }

  function demoArray() {
    const fruits = ["苹果", "香蕉", "橘子"];
    console.log("数组:", fruits);
    console.log("第1个:", fruits[0]);
    console.log("长度:", fruits.length);
    fruits.push("葡萄");
    console.log("push后:", fruits);
    console.log("map:", fruits.map((f) => "🍎 " + f));
  }

  function demoObject() {
    const user = {
      name: "张三",
      age: 25,
      email: "zhangsan@example.com",
    };
    console.log("用户对象:", user);
    console.log("姓名:", user.name);
    console.log("年龄:", user.age);
    user.age = 26;
    console.log("改年龄后:", user);
    console.log("所有键:", Object.keys(user));
  }

  // ========== Section 2 helpers ==========

  function demoFunction() {
    function greet(name: string) {
      return "你好，" + name + "！";
    }
    const greetArrow = (name: string) => {
      return "你好，" + name + "！（箭头函数）";
    };
    const greetShort = (name: string) => "你好，" + name + "！（简写）";

    console.log(greet("小明"));
    console.log(greetArrow("小红"));
    console.log(greetShort("小刚"));
  }

  function demoGreet() {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      console.log("请先在输入框里输入名字");
      return;
    }
    const greet = (name: string) => "你好，" + name + "！欢迎学习 JavaScript！";
    console.log(greet(trimmed));
  }

  // ========== Section 3 helpers ==========

  function demoIfElse() {
    const score = Number(scoreInput) || 75;
    console.log("分数:", score);
    if (score >= 90) {
      console.log("等级: 优秀 🎉");
    } else if (score >= 60) {
      console.log("等级: 及格");
    } else {
      console.log("等级: 不及格");
    }
  }

  function demoAllTypes() {
    const str = "hello";
    const num = 42;
    const bool = true;
    const arr = [1, 2, 3];
    const obj = { key: "value" };
    console.log("string:", typeof str, "| 值:", str);
    console.log("number:", typeof num, "| 值:", num);
    console.log("boolean:", typeof bool, "| 值:", bool);
    console.log("array:", Array.isArray(arr) ? "array" : typeof arr, "| 值:", arr);
    console.log("object:", typeof obj, "| 值:", obj);
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-black">Day 8: JavaScript 核心概念</h1>
          <p className="mt-2 text-zinc-600">
            变量与数据类型 → 函数 → 条件判断。每个示例都可以点击"运行"查看结果。
          </p>
        </div>

        {/* Section 1: Variables & Data Types */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">一、变量与数据类型</h2>
          <p className="mt-1 text-sm text-zinc-500">let/const、String、Number、Boolean、Array、Object</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button variant="outline" onClick={() => run(demoVariables)}>
              变量 let / const
            </Button>
            <Button variant="outline" onClick={() => run(demoString)}>
              字符串 String
            </Button>
            <Button variant="outline" onClick={() => run(demoNumber)}>
              数字 Number
            </Button>
            <Button variant="outline" onClick={() => run(demoBoolean)}>
              布尔 Boolean
            </Button>
            <Button variant="outline" onClick={() => run(demoArray)}>
              数组 Array
            </Button>
            <Button variant="outline" onClick={() => run(demoObject)}>
              对象 Object
            </Button>
            <Button variant="outline" onClick={() => run(demoAllTypes)}>
              typeof 查看类型
            </Button>
          </div>

          <ConsoleOutput lines={output} />
        </section>

        {/* Section 2: Functions */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">二、函数</h2>
          <p className="mt-1 text-sm text-zinc-500">
            普通函数 function / 箭头函数 () =&gt; {"{}"} / 参数和返回值
          </p>

          <div className="mt-4 space-y-3">
            <Button variant="outline" onClick={() => run(demoFunction)}>
              运行函数示例
            </Button>

            <div className="flex items-center gap-2">
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") run(demoGreet);
                }}
                placeholder="输入你的名字"
                className="max-w-[200px]"
              />
              <Button onClick={() => run(demoGreet)}>打招呼</Button>
            </div>
            <p className="text-xs text-zinc-400">
              今日检验：传入名字，返回"你好，xxx" ↑
            </p>
          </div>

          <ConsoleOutput lines={output} />
        </section>

        {/* Section 3: if/else */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">三、if/else 条件判断</h2>
          <p className="mt-1 text-sm text-zinc-500">if / else if / else</p>

          <div className="mt-4 flex items-center gap-2">
            <Input
              type="number"
              value={scoreInput}
              onChange={(e) => setScoreInput(e.target.value)}
              placeholder="输入分数"
              className="max-w-[150px]"
            />
            <Button onClick={() => run(demoIfElse)}>判断等级</Button>
          </div>

          <ConsoleOutput lines={output} />
        </section>

        {/* Section 4: 5 Exercises */}
        <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-6">
          <h2 className="text-xl font-bold text-indigo-900">四、5 道练习题</h2>
          <p className="mt-1 text-sm text-indigo-600">
            打开浏览器控制台（F12 → Console），逐题敲一遍
          </p>

          <ol className="mt-4 space-y-4 text-sm text-zinc-700">
            <li className="rounded-lg border border-indigo-200 bg-white p-3">
              <strong>题1：</strong>声明一个变量 <code>myName</code> 存你的名字，再声明一个变量{" "}
              <code>myAge</code> 存你的年龄，然后用 <code>console.log</code> 打印一句"我叫xxx，今年xx岁"
            </li>
            <li className="rounded-lg border border-indigo-200 bg-white p-3">
              <strong>题2：</strong>创建一个数组 <code>scores = [85, 92, 78, 95, 88]</code>，
              用 <code>.map()</code> 让每个分数加 5 分，打印新数组
            </li>
            <li className="rounded-lg border border-indigo-200 bg-white p-3">
              <strong>题3：</strong>创建一个对象 <code>book</code>，包含 title（书名）、author（作者）、pages（页数）三个属性，打印整个对象
            </li>
            <li className="rounded-lg border border-indigo-200 bg-white p-3">
              <strong>题4：</strong>写一个函数 <code>add(a, b)</code>，接收两个数字参数，返回它们的和。
              分别用普通函数和箭头函数各写一遍
            </li>
            <li className="rounded-lg border border-indigo-200 bg-white p-3">
              <strong>题5：</strong>写一个函数 <code>checkAge(age)</code>：如果 age ≥ 18 返回"成年人"，
              否则返回"未成年人"。用 if/else 实现
            </li>
          </ol>

          <div className="mt-4">
            <Button
              onClick={() => {
                console.clear();
                console.log("=== 题1 ===");
                const myName = "张三";
                const myAge = 25;
                console.log("我叫" + myName + "，今年" + myAge + "岁");

                console.log("=== 题2 ===");
                const scores = [85, 92, 78, 95, 88];
                console.log("原数组:", scores);
                console.log("加5分:", scores.map((s) => s + 5));

                console.log("=== 题3 ===");
                const book = { title: "JavaScript入门", author: "李明", pages: 320 };
                console.log(book);

                console.log("=== 题4 ===");
                function add(a: number, b: number) {
                  return a + b;
                }
                const addArrow = (a: number, b: number) => a + b;
                console.log("普通函数:", add(3, 5));
                console.log("箭头函数:", addArrow(3, 5));

                console.log("=== 题5 ===");
                function checkAge(age: number) {
                  if (age >= 18) return "成年人";
                  else return "未成年人";
                }
                console.log("25岁:", checkAge(25));
                console.log("12岁:", checkAge(12));
              }}
              variant="default"
            >
              在控制台运行全部答案（先按 F12 打开控制台）
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
