"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Task {
  id: number;
  text: string;
  done: boolean;
}

export default function TodoPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");

  function addTask() {
    const trimmed = input.trim();
    if (!trimmed) return;

    const newTask: Task = {
      id: Date.now(),
      text: trimmed,
      done: false,
    };

    setTasks([...tasks, newTask]);
    setInput("");
  }

  function toggleTask(id: number) {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  }

  function deleteTask(id: number) {
    setTasks(tasks.filter((task) => task.id !== id));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      addTask();
    }
  }

  const undoneCount = tasks.filter((t) => !t.done).length;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="mb-1 text-center text-2xl font-bold text-black">
          待办事项
        </h1>
        <p className="mb-6 text-center text-sm text-zinc-500">
          {tasks.length === 0
            ? "添加你的第一个任务吧"
            : `还有 ${undoneCount} 项未完成`}
        </p>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入新任务..."
          />
          <Button onClick={addTask}>添加</Button>
        </div>

        <div className="mt-6">
          {tasks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 py-12 text-center text-sm text-zinc-400">
              还没有任务，在上方输入并点击"添加"
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2.5"
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      task.done
                        ? "border-indigo-600 bg-indigo-600"
                        : "border-zinc-300 hover:border-indigo-400"
                    }`}
                  >
                    {task.done && (
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>

                  <span
                    className={`flex-1 text-sm ${
                      task.done
                        ? "text-zinc-400 line-through"
                        : "text-black"
                    }`}
                  >
                    {task.text}
                  </span>

                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => deleteTask(task.id)}
                    className="text-zinc-400 hover:text-red-500"
                  >
                    删除
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
