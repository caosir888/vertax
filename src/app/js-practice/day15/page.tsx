"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ============================================================
// Props 演示：子组件
// ============================================================

function Greeting({ name, age }: { name: string; age: number }) {
  return (
    <div className="rounded-lg bg-indigo-50 px-4 py-3 text-sm">
      你好，我叫 <strong className="text-indigo-700">{name}</strong>，今年{" "}
      <strong className="text-indigo-700">{age}</strong> 岁。
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <h3 className="mb-2 text-sm font-bold text-zinc-700">{title}</h3>
      {children}
    </div>
  );
}

function TodoItem({
  todo,
  onToggle,
  onDelete,
}: {
  todo: { id: number; text: string; done: boolean };
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded border border-zinc-200 px-3 py-2">
      <button
        onClick={() => onToggle(todo.id)}
        className={`h-4 w-4 rounded border-2 ${
          todo.done ? "border-green-500 bg-green-500" : "border-zinc-300"
        }`}
      />
      <span className={`flex-1 text-sm ${todo.done ? "text-zinc-400 line-through" : ""}`}>
        {todo.text}
      </span>
      <button
        onClick={() => onDelete(todo.id)}
        className="text-xs text-zinc-400 hover:text-red-500"
      >
        删除
      </button>
    </div>
  );
}

// ============================================================
// 主页面
// ============================================================

export default function Day15Page() {
  // ---- useState 演示 ----
  const [count, setCount] = useState(0);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState("");

  // ---- useEffect 演示 ----
  const [seconds, setSeconds] = useState(0);
  const [timerOn, setTimerOn] = useState(false);

  useEffect(() => {
    if (!timerOn) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id); // 清理函数
  }, [timerOn]);

  // ---- 条件渲染演示 ----
  const [showModal, setShowModal] = useState(false);
  const [role, setRole] = useState<"guest" | "user" | "admin">("guest");

  // ---- 列表渲染演示 ----
  const [todos, setTodos] = useState([
    { id: 1, text: "学习 useState", done: true },
    { id: 2, text: "学习 useEffect", done: false },
    { id: 3, text: "学习 Props", done: false },
  ]);
  const [newTodo, setNewTodo] = useState("");

  function addTodo() {
    if (!newTodo.trim()) return;
    setTodos([...todos, { id: Date.now(), text: newTodo.trim(), done: false }]);
    setNewTodo("");
  }

  function toggleTodo(id: number) {
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function deleteTodo(id: number) {
    setTodos(todos.filter((t) => t.id !== id));
  }

  // ---- 综合：useEffect 模拟数据加载 ----
  const [loading, setLoading] = useState(true);
  const [userList, setUserList] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    // 模拟 1.5 秒后"加载"数据
    const timer = setTimeout(() => {
      setUserList([
        { id: 1, name: "张三" },
        { id: 2, name: "李四" },
        { id: 3, name: "王五" },
      ]);
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []); // 空依赖 = 只在组件首次渲染时执行

  // ============================================================
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-black">
            Day 15: React 核心概念深入
          </h1>
          <p className="mt-2 text-zinc-600">
            useState / useEffect / Props / 条件渲染 / 列表渲染 —— 每个概念都可以在下方直接操作
          </p>
        </div>

        {/* ============ 一、useState ============ */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">一、useState — 让组件记住状态</h2>
          <p className="mt-1 text-sm text-zinc-500">
            useState(初始值) 返回 [当前值, 修改函数]。调用修改函数 → React 重新渲染组件。
          </p>

          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            {/* 计数器 */}
            <Card title="计数器 (数字状态)">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setCount(count - 1)}>
                  -1
                </Button>
                <span className="w-10 text-center text-2xl font-bold">{count}</span>
                <Button variant="outline" size="sm" onClick={() => setCount(count + 1)}>
                  +1
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setCount(0)}>
                  重置
                </Button>
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                useState(0) → count 初始为 0，setCount 触发重新渲染
              </p>
            </Card>

            {/* 受控输入 */}
            <Card title="受控输入 (字符串状态)">
              <div className="flex gap-2">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="输入内容"
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    setSubmitted(text);
                    setText("");
                  }}
                >
                  提交
                </Button>
              </div>
              {submitted && (
                <p className="mt-2 text-sm text-zinc-600">
                  上次提交: <strong>{submitted}</strong>
                </p>
              )}
              <p className="mt-1 text-xs text-zinc-400">
                input value + onChange = React 控制输入，输入框的值始终 = state
              </p>
            </Card>
          </div>

          <div className="mt-4 rounded-lg bg-zinc-900 p-4 font-mono text-xs text-green-400">
            <div>
              <span className="text-blue-400">const</span> [count, setCount] ={" "}
              <span className="text-yellow-300">useState</span>(<span className="text-orange-300">0</span>);
            </div>
            <div className="mt-1 text-zinc-500">
              // count = 当前值（只读，不要直接改）
            </div>
            <div className="text-zinc-500">
              // setCount = 修改函数（调用它 → React 重新渲染）
            </div>
            <div className="text-zinc-500">
              // 0 = 初始值
            </div>
          </div>
        </section>

        {/* ============ 二、useEffect ============ */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">二、useEffect — 在渲染后执行副作用</h2>
          <p className="mt-1 text-sm text-zinc-500">
            副作用 = 定时器、发网络请求、操作 DOM、订阅事件。在 React 渲染完页面之后执行。
          </p>

          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            {/* 定时器 */}
            <Card title="定时器 (带清理)">
              <div className="text-center">
                <div className="text-3xl font-mono font-bold">{seconds}s</div>
                <div className="mt-3 flex gap-2 justify-center">
                  <Button size="sm" onClick={() => setTimerOn(!timerOn)}>
                    {timerOn ? "暂停" : "开始"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTimerOn(false);
                      setSeconds(0);
                    }}
                  >
                    重置
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                依赖 = [timerOn]，timerOn 变化时重新执行 effect。return 的函数在组件卸载或下次 effect 前执行（清理）。
              </p>
            </Card>

            {/* 数据加载 */}
            <Card title="模拟数据加载">
              {loading ? (
                <p className="text-sm text-zinc-400">⏳ 加载中...（1.5秒后显示）</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {userList.map((u) => (
                    <li key={u.id} className="text-zinc-700">
                      {u.name}
                    </li>
                  ))}
                </ul>
              )}
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => {
                  setLoading(true);
                  setUserList([]);
                  setTimeout(() => {
                    setUserList([
                      { id: 1, name: "张三" },
                      { id: 2, name: "李四" },
                      { id: 3, name: "王五" },
                    ]);
                    setLoading(false);
                  }, 1500);
                }}
              >
                重新加载
              </Button>
              <p className="mt-2 text-xs text-zinc-400">
                依赖 = []（空数组）→ 只在首次渲染后执行一次（类似 componentDidMount）
              </p>
            </Card>
          </div>

          <div className="mt-4 rounded-lg bg-zinc-900 p-4 font-mono text-xs text-green-400">
            <div>
              <span className="text-yellow-300">useEffect</span>(() =&gt; {"{"}
            </div>
            <div className="pl-4 text-zinc-500">// 副作用代码：定时器、fetch、订阅...</div>
            <div className="pl-4">
              <span className="text-blue-400">const</span> timer = setInterval(...);
            </div>
            <div className="pl-4 text-zinc-500">// return 清理函数（可选）</div>
            <div className="pl-4">
              <span className="text-blue-400">return</span> () =&gt; clearInterval(timer);
            </div>
            <div>
              {"}"}, [依赖数组]);
            </div>
            <div className="mt-1 text-zinc-500">
              // [] = 只执行一次 | [count] = count 变化时执行 | 不传 = 每次渲染都执行
            </div>
          </div>
        </section>

        {/* ============ 三、Props ============ */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">
            三、Props — 父组件向子组件传递数据
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Props 是组件的"参数"。父组件在 JSX 里写属性，子组件从参数里读。Props 是<strong>只读</strong>的。
          </p>

          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            {/* Greeting 子组件 */}
            <Card title="简单 Props（数据展示）">
              <Greeting name="张三" age={25} />
              <div className="mt-3 text-xs text-zinc-400">
                父组件传: &lt;Greeting name=&quot;张三&quot; age={"{"}25{"}"} /&gt;
              </div>
              <div className="mt-1 text-xs text-zinc-400">
                子组件: {"function Greeting({ name, age })"}
              </div>
            </Card>

            {/* TodoItem 子组件 */}
            <Card title="Props + 回调（子→父通信）">
              <div className="space-y-2">
                {todos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={toggleTodo}
                    onDelete={deleteTodo}
                  />
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Input
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  placeholder="新任务"
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && addTodo()}
                />
                <Button size="sm" onClick={addTodo}>
                  添加
                </Button>
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                父传子: 数据通过 props 下传 | 子传父: 父把回调函数传给子，子调用回调
              </p>
            </Card>
          </div>

          <div className="mt-4 rounded-lg bg-zinc-900 p-4 font-mono text-xs text-green-400">
            <div className="text-zinc-500">// 数据向下流动，事件向上冒泡</div>
            <div>{"<Parent>"}</div>
            <div className="pl-4">
              {"<Child"} <span className="text-orange-300">data</span>={"{"}value{"}"}{" "}
              <span className="text-orange-300">onAction</span>={"{"}callback{"}"} /&gt;
            </div>
            <div>{"</Parent>"}</div>
            <div className="mt-1 text-zinc-500">// Props 是只读的，子组件不能修改 props</div>
            <div className="text-zinc-500">// 如果要"改"，通过调用父组件传下来的回调函数</div>
          </div>
        </section>

        {/* ============ 四、条件渲染 ============ */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">四、条件渲染 — 根据不同状态显示不同 UI</h2>
          <p className="mt-1 text-sm text-zinc-500">
            三种常用方式：&& 运算符 / 三元表达式 / if-return
          </p>

          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            {/* && 演示 */}
            <Card title="&& 运算符（显示/隐藏）">
              <Button size="sm" onClick={() => setShowModal(!showModal)}>
                {showModal ? "关闭弹窗" : "打开弹窗"}
              </Button>
              {showModal && (
                <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm">
                  <strong>这是一个条件渲染的弹窗</strong>
                  <p className="mt-1 text-zinc-500">
                    只有当 showModal 为 true 时，这个元素才会出现在页面上。
                  </p>
                </div>
              )}
              <p className="mt-2 text-xs text-zinc-400">
                {"{showModal && <div>内容</div>}"} → showModal 为 true 才渲染
              </p>
            </Card>

            {/* 三元 / 角色切换 */}
            <Card title="三元表达式 + 多种状态">
              <div className="flex gap-2 mb-3">
                {(["guest", "user", "admin"] as const).map((r) => (
                  <Button
                    key={r}
                    size="sm"
                    variant={role === r ? "default" : "outline"}
                    onClick={() => setRole(r)}
                  >
                    {r === "guest" ? "访客" : r === "user" ? "用户" : "管理员"}
                  </Button>
                ))}
              </div>

              <div className="rounded-lg bg-zinc-50 p-3 text-sm">
                {role === "admin" ? (
                  <div className="text-red-600">
                    🔧 管理员面板：可以删除用户、修改配置
                  </div>
                ) : role === "user" ? (
                  <div className="text-blue-600">
                    👤 用户面板：可以查看内容、编辑自己的资料
                  </div>
                ) : (
                  <div className="text-zinc-400">
                    👀 访客面板：只能浏览公开内容，请先登录
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                三元: condition ? &lt;A /&gt; : &lt;B /&gt; | 适合二选一或多层嵌套
              </p>
            </Card>
          </div>

          <div className="mt-4 rounded-lg bg-zinc-900 p-4 font-mono text-xs text-green-400">
            <div className="text-zinc-500">// 方式1: && 运算符（最简单）</div>
            <div>{"{isOpen && <Modal />}"}</div>
            <div className="mt-1 text-zinc-500">// 方式2: 三元表达式（二选一）</div>
            <div>{"{isLoading ? <Spinner /> : <Content />}"}</div>
            <div className="mt-1 text-zinc-500">// 方式3: if-return（最灵活）</div>
            <div><span className="text-blue-400">if</span> (!user) <span className="text-blue-400">return</span> &lt;LoginPage /&gt;;</div>
          </div>
        </section>

        {/* ============ 五、列表渲染 ============ */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-black">
            五、列表渲染 — .map() 把数组转成 JSX 数组
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            每个元素需要唯一的 key 属性（React 用 key 追踪哪些项变了、加了、删了）。
          </p>

          <div className="mt-4 rounded-lg bg-zinc-900 p-4 font-mono text-xs text-green-400">
            <div>{"{items.map((item) => ("}</div>
            <div className="pl-4">
              &lt;li <span className="text-orange-300">key</span>={"{"}item.id{"}"}&gt;{"{"}item.name{"}"}&lt;/li&gt;
            </div>
            <div>{"))}"}</div>
            <div className="mt-1 text-red-400">
              {/* eslint-disable-next-line react/jsx-no-comment-textnodes */}
              // ⚠️ 永远不要用数组索引(index)做 key，用稳定的唯一 ID
            </div>
            <div className="text-zinc-500">// key 帮助 React 高效更新列表（不重新渲染整个列表）</div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-zinc-500">
              上方"Props"部分的 TodoItem 列表就是 .map() 的完整示例。你在 /todo 和 /memos 页面也已经大量使用过。
            </p>
          </div>
        </section>

        {/* ============ 六、3 道练习题 ============ */}
        <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-6">
          <h2 className="text-xl font-bold text-indigo-900">六、3 道 React 练习题</h2>
          <p className="mt-1 text-sm text-indigo-600">
            在控制台或新建一个组件完成。每题都涉及今天学的核心概念。
          </p>

          <ol className="mt-4 space-y-4 text-sm text-zinc-700">
            <li className="rounded-lg border border-indigo-200 bg-white p-3">
              <strong>题1 useState：</strong>做一个"点赞"按钮，点击后数字+1，再点-1（切换赞/取消赞）。
              按钮颜色随状态变化（已赞=红色，未赞=灰色）。
            </li>
            <li className="rounded-lg border border-indigo-200 bg-white p-3">
              <strong>题2 useEffect：</strong>做一个时钟组件，每秒更新一次时间，显示格式"14:30:05"。
              组件卸载时清理定时器。
            </li>
            <li className="rounded-lg border border-indigo-200 bg-white p-3">
              <strong>题3 Props：</strong>提取一个 <code>UserCard</code> 组件，接收{" "}
              <code>{"{name, email, avatar}"}</code> 三个 props，
              在父组件里循环渲染 3 个不同的 UserCard。
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}
