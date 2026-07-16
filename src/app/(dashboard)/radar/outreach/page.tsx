"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface LiteLead {
  id: string;
  name: string;
  company: string;
  email: string;
  status: string;
  next_contact_date: string;
  notes: string;
}

interface LiteTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignee_id?: string;
  created_at: string;
}

interface LiteOpp {
  id: string;
  name: string;
  company: string;
  stage: string;
  deal_value: number;
  probability: number;
  expected_close_date: string;
}

interface OutreachData {
  leads_to_follow_up: LiteLead[];
  tasks_due_today: LiteTask[];
  opportunities_closing: LiteOpp[];
  today: string;
}

const STATUS_LABELS: Record<string, string> = {
  new: "新线索",
  contacted: "已联系",
  qualified: "已确认",
  proposal: "提案中",
  won: "已成交",
  lost: "已流失",
};

const STAGE_LABELS: Record<string, string> = {
  initial_contact: "初步接触",
  needs_confirmation: "需求确认",
  proposal_quote: "方案报价",
  negotiation: "谈判",
};

const TASK_STATUS_LABELS: Record<string, string> = {
  pending: "待处理",
  in_progress: "进行中",
  done: "已完成",
};

const TASK_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
};

function formatMoney(v: number) {
  if (v >= 10000) return `¥${(v / 10000).toFixed(1)}万`;
  return `¥${v.toLocaleString()}`;
}

export default function OutreachPage() {
  const [data, setData] = useState<OutreachData | null>(null);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { href: "/radar", label: "总览", active: false },
    { href: "/radar/icp", label: "目标客户画像", active: false },
    { href: "/radar/discover", label: "新发现", active: false },
    { href: "/radar/outreach", label: "外联工作台", active: true },
    { href: "/leads", label: "线索库", active: false },
  ];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/outreach");
      const json = await res.json();
      if (json.data) setData(json.data);
    } catch {
      // ignore
    }
    setLoading(false);
  }

  async function recordContact(leadId: string) {
    try {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 7);
      await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "contacted",
          next_contact_date: nextDate.toISOString().slice(0, 10),
        }),
      });
      loadData();
    } catch {
      // ignore
    }
  }

  async function skipLead(leadId: string) {
    try {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 3);
      await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          next_contact_date: nextDate.toISOString().slice(0, 10),
        }),
      });
      loadData();
    } catch {
      // ignore
    }
  }

  async function updateTaskStatus(taskId: string, status: string) {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      loadData();
    } catch {
      // ignore
    }
  }

  const todayText = data?.today
    ? new Date(data.today).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })
    : "";

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">今日外联工作台</h1>
        <p className="text-sm text-zinc-500 mt-1">{todayText}</p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 bg-zinc-100 rounded-lg p-1 w-fit overflow-x-auto">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              tab.active ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-zinc-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. 待跟进线索 */}
          <div className="bg-white border rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <span>📞</span> 待跟进线索
              <span className="text-xs text-zinc-400 font-normal">
                ({data?.leads_to_follow_up.length || 0})
              </span>
            </h3>
            {data?.leads_to_follow_up.length === 0 ? (
              <p className="text-sm text-zinc-400 py-4 text-center">今天没有需要跟进的线索 🎉</p>
            ) : (
              <div className="space-y-2">
                {data?.leads_to_follow_up.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between bg-zinc-50 rounded-lg p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-800 truncate">
                        {lead.name}
                        {lead.company && <span className="text-zinc-400 ml-2">@{lead.company}</span>}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-600">
                          {STATUS_LABELS[lead.status] || lead.status}
                        </span>
                        <span className="text-xs text-zinc-400">
                          联系日：{lead.next_contact_date}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-3">
                      <button
                        onClick={() => recordContact(lead.id)}
                        className="text-xs bg-black text-white px-3 py-1 rounded-lg hover:bg-zinc-800"
                      >
                        记录联系
                      </button>
                      <button
                        onClick={() => skipLead(lead.id)}
                        className="text-xs text-zinc-400 hover:text-zinc-600 px-2 py-1"
                      >
                        延后 3 天
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. 今日任务 */}
          <div className="bg-white border rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <span>✅</span> 今日任务
              <span className="text-xs text-zinc-400 font-normal">
                ({data?.tasks_due_today.length || 0})
              </span>
            </h3>
            {data?.tasks_due_today.length === 0 ? (
              <p className="text-sm text-zinc-400 py-4 text-center">暂无待处理任务</p>
            ) : (
              <div className="space-y-2">
                {data?.tasks_due_today.map((task) => (
                  <div key={task.id} className="flex items-center justify-between bg-zinc-50 rounded-lg p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-800 truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${TASK_STATUS_COLORS[task.status] || ""}`}>
                          {TASK_STATUS_LABELS[task.status] || task.status}
                        </span>
                        <span className="text-xs text-zinc-400">
                          {task.priority === "high" ? "🔴 高" : task.priority === "medium" ? "🟡 中" : "🟢 低"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-3">
                      {task.status === "pending" && (
                        <button
                          onClick={() => updateTaskStatus(task.id, "in_progress")}
                          className="text-xs bg-black text-white px-3 py-1 rounded-lg hover:bg-zinc-800"
                        >
                          开始
                        </button>
                      )}
                      {task.status === "in_progress" && (
                        <button
                          onClick={() => updateTaskStatus(task.id, "done")}
                          className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700"
                        >
                          完成
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. 即将到期商机 */}
          <div className="bg-white border rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <span>⏰</span> 即将到期商机（7天内）
              <span className="text-xs text-zinc-400 font-normal">
                ({data?.opportunities_closing.length || 0})
              </span>
            </h3>
            {data?.opportunities_closing.length === 0 ? (
              <p className="text-sm text-zinc-400 py-4 text-center">没有即将到期的商机</p>
            ) : (
              <div className="space-y-2">
                {data?.opportunities_closing.map((opp) => {
                  const daysLeft = Math.ceil(
                    (new Date(opp.expected_close_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div key={opp.id} className="flex items-center justify-between bg-zinc-50 rounded-lg p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-800 truncate">
                          {opp.name}
                          {opp.company && <span className="text-zinc-400 ml-2">@{opp.company}</span>}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-600">
                            {STAGE_LABELS[opp.stage] || opp.stage}
                          </span>
                          <span className="text-xs text-zinc-500 font-medium">
                            {formatMoney(opp.deal_value)} · {opp.probability}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-lg ${daysLeft <= 3 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>
                          {daysLeft} 天后
                        </span>
                        <Link
                          href="/opportunities"
                          className="text-xs text-blue-600 hover:underline ml-2"
                        >
                          查看
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
