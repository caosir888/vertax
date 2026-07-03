"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { PlanInfo } from "@/types";

export default function PricingPage() {
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [user, setUser] = useState<{ team_id?: string } | null>(null);

  useEffect(() => {
    fetch("/api/subscription/plans")
      .then((r) => r.json())
      .then((j) => { if (j.data) setPlans(j.data); })
      .catch(() => {});

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => {
        if (j.data) {
          setUser(j.data);
          fetch("/api/subscription")
            .then((r2) => r2.json())
            .then((j2) => { if (j2.data) setCurrentPlan(j2.data.plan); })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* 顶栏 */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-white">
        <Link href="/" className="text-lg font-bold text-black">VertaX</Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard" className="text-sm text-zinc-600 hover:text-black">进入后台</Link>
          ) : (
            <>
              <Link href="/login" className="text-sm text-zinc-600 hover:text-black">登录</Link>
              <Link href="/register" className="text-sm rounded-lg bg-black text-white px-4 py-2 hover:bg-zinc-800">免费注册</Link>
            </>
          )}
        </div>
      </header>

      {/* 标题 */}
      <section className="text-center py-16 px-6">
        <h1 className="text-3xl font-bold text-black mb-3">选择适合你的方案</h1>
        <p className="text-zinc-500 max-w-md mx-auto">14 天免费试用，无需信用卡。随时升级，随时取消。</p>
      </section>

      {/* 方案卡片 */}
      <section className="max-w-5xl mx-auto px-6 pb-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isPro = plan.id === "pro";
          return (
            <div
              key={plan.id}
              className={`rounded-2xl border bg-white p-6 relative ${
                isPro ? "border-black shadow-lg scale-[1.02]" : "border-zinc-200"
              }`}
            >
              {isPro && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-black text-white text-xs px-3 py-1 font-medium">
                  推荐
                </span>
              )}

              <h3 className="text-lg font-bold text-black mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-bold text-black">{plan.priceLabel}</span>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-600">
                    <span className="text-green-500 text-xs">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {user ? (
                isCurrent ? (
                  <Button disabled className="w-full rounded-xl text-sm opacity-50">当前方案</Button>
                ) : (
                  <Button
                    onClick={async () => {
                      if (!confirm(`确认升级到 ${plan.name}（${plan.priceLabel}）？\n（模拟支付，不会产生真实费用）`)) return;
                      const res = await fetch("/api/subscription/upgrade", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ plan: plan.id }),
                      });
                      const json = await res.json();
                      if (json.error) { alert(json.error); return; }
                      alert(`升级成功！交易ID: ${json.data.transaction_id}`);
                      setCurrentPlan(plan.id);
                    }}
                    className="w-full rounded-xl bg-black text-white hover:bg-zinc-800 text-sm"
                  >
                    升级
                  </Button>
                )
              ) : (
                <Link href="/register">
                  <Button className="w-full rounded-xl bg-black text-white hover:bg-zinc-800 text-sm">
                    开始免费试用
                  </Button>
                </Link>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
