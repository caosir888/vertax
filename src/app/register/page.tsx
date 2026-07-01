"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow">
        <h1 className="mb-2 text-center text-2xl font-bold text-black">
          注册 VertaX
        </h1>
        <p className="mb-6 text-center text-sm text-zinc-500">
          创建你的账号，免费开始使用
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-zinc-700">
              姓名
            </label>
            <Input
              id="name"
              type="text"
              placeholder="你的名字"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-zinc-700">
              邮箱
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-zinc-700">
              密码
            </label>
            <Input
              id="password"
              type="password"
              placeholder="至少 8 位密码"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-700">
              确认密码
            </label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="再次输入密码"
            />
          </div>

          <Button type="submit" disabled={loading} className="mt-2 w-full">
            {loading ? "注册中..." : "注册"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          已有账号？{" "}
          <a href="/login" className="font-medium text-black underline">
            立即登录
          </a>
        </p>
      </div>
    </div>
  );
}
