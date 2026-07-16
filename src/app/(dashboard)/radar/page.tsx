"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface RadarStats {
  newDiscoveries: number;
  highScore: number;
  followedUp: number;
  lastScan: string | null;
  latestJob?: { status: string; leads_found: number; completed_at: string } | null;
}

export default function RadarPage() {
  const [stats, setStats] = useState<RadarStats>({
    newDiscoveries: 0,
    highScore: 0,
    followedUp: 0,
    lastScan: null,
  });
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchMsg, setSearchMsg] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/radar/overview");
      const json = await res.json();
      if (json.data) setStats(json.data);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleStartSearch = async () => {
    setSearching(true);
    setSearchMsg("正在启动 AI 搜索...");
    try {
      const res = await fetch("/api/radar/search", { method: "POST" });
      const json = await res.json();
      if (json.data?.error) {
        setSearchMsg(`搜索失败: ${json.data.error}`);
      } else {
        setSearchMsg(`搜索完成！发现 ${json.data?.leadsFound || 0} 个潜在客户`);
        fetchStats();
      }
    } catch {
      setSearchMsg("搜索请求失败，请重试");
    }
    setSearching(false);
  };

  const tabs = [
    { href: "/radar", label: "总览", active: true },
    { href: "/radar/icp", label: "目标客户画像", active: false },
    { href: "/radar/discover", label: "新发现", active: false },
    { href: "/radar/outreach", label: "外联工作台", active: false },
    { href: "/leads", label: "线索库", active: false },
  ];

  const lastScanText = stats.lastScan
    ? new Date(stats.lastScan).toLocaleString("zh-CN")
    : "暂无记录";

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">获客雷达</h1>
          <p className="text-sm text-zinc-500 mt-1">
            AI 驱动的全球潜在客户智能发现系统
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-zinc-50 disabled:opacity-50"
          >
            刷新
          </button>
          <button
            onClick={handleStartSearch}
            disabled={searching}
            className="px-5 py-2 text-sm bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 font-medium"
          >
            {searching ? "搜索中..." : "开始自动搜索"}
          </button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 bg-zinc-100 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab.active ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {searchMsg && (
        <div className={`p-3 rounded-lg text-sm ${searchMsg.includes("失败") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {searchMsg}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm text-zinc-500 mb-1">新发现</p>
          <p className="text-3xl font-bold text-blue-600">
            {loading ? "..." : stats.newDiscoveries}
          </p>
          <p className="text-xs text-zinc-400 mt-1">AI 雷达发现</p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm text-zinc-500 mb-1">AI 高评分</p>
          <p className="text-3xl font-bold text-amber-600">
            {loading ? "..." : stats.highScore}
          </p>
          <p className="text-xs text-zinc-400 mt-1">评分 &ge; 70 分</p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm text-zinc-500 mb-1">已跟进</p>
          <p className="text-3xl font-bold text-green-600">
            {loading ? "..." : stats.followedUp}
          </p>
          <p className="text-xs text-zinc-400 mt-1">所有状态除新线索</p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm text-zinc-500 mb-1">最后扫描</p>
          <p className="text-lg font-semibold text-zinc-800">
            {loading ? "..." : lastScanText}
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            {stats.latestJob
              ? `发现 ${stats.latestJob.leads_found} 个客户`
              : "暂无扫描记录"}
          </p>
        </div>
      </div>

      {/* Quick tips */}
      <div className="bg-zinc-50 border rounded-xl p-5">
        <h3 className="font-semibold text-sm mb-3">快速入门</h3>
        <div className="grid grid-cols-3 gap-4 text-sm text-zinc-600">
          <div>
            <span className="font-medium text-zinc-800">1. 配置画像</span>
            <p>在"目标客户画像"中定义你的理想客户特征</p>
          </div>
          <div>
            <span className="font-medium text-zinc-800">2. 启动搜索</span>
            <p>AI 将根据画像自动发现匹配的潜在客户</p>
          </div>
          <div>
            <span className="font-medium text-zinc-800">3. 筛选跟进</span>
            <p>查看 AI 评分，优先跟进高分线索</p>
          </div>
        </div>
      </div>
    </div>
  );
}
