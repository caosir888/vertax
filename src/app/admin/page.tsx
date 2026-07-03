"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

interface AdminStats {
  totalTenants: number;
  totalUsers: number;
  monthTenants: number;
  mrr: number;
  planCount: Record<string, number>;
  statusCount: Record<string, number>;
}

interface Tenant {
  id: string;
  name: string;
  company_name: string;
  plan: string;
  subscription_status: string;
  trial_ends_at: string | null;
  member_count: number;
  content_count: number;
  lead_count: number;
  created_at: string;
}

const planNames: Record<string, string> = { free: "Free", pro: "Pro", enterprise: "Enterprise" };
const statusNames: Record<string, string> = { trial: "试用中", active: "已激活", cancelled: "已取消", expired: "已过期" };
const statusColors: Record<string, string> = { trial: "bg-blue-100 text-blue-700", active: "bg-green-100 text-green-700", cancelled: "bg-yellow-100 text-yellow-700", expired: "bg-red-100 text-red-700" };

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetch("/api/admin")
      .then((r) => r.json())
      .then((j) => { if (j.data) setStats(j.data); })
      .catch(() => {});
    loadTenants();
  }, [planFilter, statusFilter]);

  async function loadTenants() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (planFilter) params.set("plan", planFilter);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/tenants?${params}`);
      const json = await res.json();
      if (json.data) setTenants(json.data);
    } catch { toast.error("加载失败"); }
    finally { setLoading(false); }
  }

  async function updateTenant(id: string, updates: Record<string, string>) {
    try {
      const res = await fetch(`/api/admin/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (json.error) { toast.error(json.error); return; }
      toast.success("已更新");
      loadTenants();
    } catch { toast.error("更新失败"); }
  }

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold text-black mb-6">运营管理后台</h1>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-400 mb-1">总租户</p>
            <p className="text-2xl font-bold text-black">{stats.totalTenants}</p>
            <p className="text-xs text-zinc-400 mt-1">本月 +{stats.monthTenants}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-400 mb-1">总用户</p>
            <p className="text-2xl font-bold text-black">{stats.totalUsers}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-400 mb-1">月经常性收入</p>
            <p className="text-2xl font-bold text-black">${stats.mrr}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-400 mb-1">方案分布</p>
            <div className="text-sm text-zinc-600 mt-1">
              {Object.entries(stats.planCount).map(([plan, count]) => (
                <span key={plan} className="mr-2">{planNames[plan]}: {count}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 筛选栏 */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") loadTenants(); }}
          placeholder="搜索租户名称..."
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-black w-48"
        />
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none"
        >
          <option value="">全部方案</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none"
        >
          <option value="">全部状态</option>
          <option value="trial">试用中</option>
          <option value="active">已激活</option>
          <option value="cancelled">已取消</option>
          <option value="expired">已过期</option>
        </select>
        <button onClick={loadTenants} className="text-xs text-zinc-400 hover:text-zinc-600">搜索</button>
      </div>

      {/* 租户列表 */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-zinc-100 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {tenants.map((t) => (
            <div key={t.id} className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-black">{t.name}</h3>
                    {t.company_name && <span className="text-xs text-zinc-400">({t.company_name})</span>}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusColors[t.subscription_status] || "bg-zinc-100"}`}>
                      {statusNames[t.subscription_status] || t.subscription_status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                    <span>成员: {t.member_count}</span>
                    <span>内容: {t.content_count}</span>
                    <span>线索: {t.lead_count}</span>
                    <span>创建: {new Date(t.created_at).toLocaleDateString("zh-CN")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={t.plan}
                    onChange={(e) => updateTenant(t.id, { plan: e.target.value })}
                    className="rounded border border-zinc-200 px-2 py-1 text-xs outline-none"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                  <select
                    value={t.subscription_status}
                    onChange={(e) => updateTenant(t.id, { subscription_status: e.target.value })}
                    className="rounded border border-zinc-200 px-2 py-1 text-xs outline-none"
                  >
                    <option value="trial">试用中</option>
                    <option value="active">已激活</option>
                    <option value="cancelled">已取消</option>
                    <option value="expired">已过期</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
          {tenants.length === 0 && (
            <div className="text-center py-16">
              <p className="text-sm text-zinc-400">没有找到匹配的租户</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
