"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ========== 类型 ========== */

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
  is_active: boolean;
  member_count: number;
  content_count: number;
  lead_count: number;
  created_at: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  is_disabled: boolean;
  is_platform_admin: boolean;
  created_at: string;
  teams: { team_id: string; team_name: string; role: string }[];
}

interface MonthlyData {
  labels: string[];
  data: number[];
}

/* ========== 常量 ========== */

const planNames: Record<string, string> = { free: "Free", pro: "Pro", enterprise: "Enterprise" };
const statusNames: Record<string, string> = { trial: "试用中", active: "已激活", cancelled: "已取消", expired: "已过期" };
const statusColors: Record<string, string> = { trial: "bg-blue-100 text-blue-700", active: "bg-green-100 text-green-700", cancelled: "bg-yellow-100 text-yellow-700", expired: "bg-red-100 text-red-700" };
const roleLabels: Record<string, string> = { owner: "拥有者", admin: "管理员", editor: "编辑者", viewer: "只读" };

/* ========== 月度趋势图表（SVG 柱状图） ========== */

function MonthlyChart({ data }: { data: MonthlyData }) {
  const maxVal = Math.max(...data.data, 1);
  const w = 600;
  const h = 200;
  const pad = 30;
  const chartW = w - pad * 2;
  const chartH = h - pad * 2;
  const barW = Math.max(12, chartW / data.data.length / 2);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <h3 className="text-sm font-bold text-black mb-4">月度新增租户趋势</h3>
      {data.data.every((v) => v === 0) ? (
        <p className="text-sm text-zinc-400 text-center py-8">暂无数据</p>
      ) : (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
          {/* 网格线 */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = pad + chartH - chartH * ratio;
            return (
              <g key={ratio}>
                <line x1={pad} y1={y} x2={w - pad} y2={y} stroke="#e4e4e7" strokeWidth="0.5" />
                <text x={pad - 5} y={y + 4} textAnchor="end" className="text-[10px] fill-zinc-400">
                  {Math.round(maxVal * ratio)}
                </text>
              </g>
            );
          })}
          {/* 柱子 */}
          {data.data.map((val, i) => {
            const x = pad + (chartW / data.data.length) * i + (chartW / data.data.length - barW) / 2;
            const barH = (val / maxVal) * chartH;
            const y = pad + chartH - barH;
            return (
              <g key={i}>
                <rect x={x} y={y} width={barW} height={barH} rx="3" fill="#000" opacity="0.85" />
                <text x={x + barW / 2} y={y - 5} textAnchor="middle" className="text-[10px] fill-zinc-500">
                  {val > 0 ? val : ""}
                </text>
                <text x={x + barW / 2} y={pad + chartH + 14} textAnchor="middle" className="text-[10px] fill-zinc-400">
                  {data.labels[i]}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

/* ========== 页面主体 ========== */

export default function AdminPage() {
  const [tab, setTab] = useState<"overview" | "tenants" | "users" | "logs" | "loginLogs">("overview");

  // 概览
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [monthly, setMonthly] = useState<MonthlyData | null>(null);

  // 租户
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantSearch, setTenantSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTenant, setDetailTenant] = useState<Tenant | null>(null);

  // 用户
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userLoading, setUserLoading] = useState(false);

  // 操作日志
  const [activityLogs, setActivityLogs] = useState<{ id: string; team_id: string; user_id: string; user_name: string; action: string; target: string; details: string; created_at: string }[]>([]);
  const [logSearch, setLogSearch] = useState("");
  const [logTeamFilter, setLogTeamFilter] = useState("");
  const [logUserFilter, setLogUserFilter] = useState("");
  const [logLoading, setLogLoading] = useState(false);

  // 登录记录
  const [loginLogs, setLoginLogs] = useState<{ id: string; user_id: string; email: string; team_id: string; success: boolean; ip_address: string; user_agent: string; error_reason: string; created_at: string }[]>([]);
  const [loginLogSearch, setLoginLogSearch] = useState("");
  const [loginLogFilter, setLoginLogFilter] = useState(""); // "all", "success", "failed"
  const [loginLogLoading, setLoginLogLoading] = useState(false);

  useEffect(() => {
    if (tab === "overview") { loadStats(); loadMonthly(); }
    if (tab === "tenants") loadTenants();
    if (tab === "users") loadUsers();
    if (tab === "logs") loadActivityLogs();
    if (tab === "loginLogs") loadLoginLogs();
  }, [tab, planFilter, statusFilter]);

  /* ========== 概览 ========== */

  async function loadStats() {
    fetch("/api/admin")
      .then((r) => r.json())
      .then((j) => { if (j.data) setStats(j.data); })
      .catch(() => {});
  }

  async function loadMonthly() {
    fetch("/api/admin/stats/monthly")
      .then((r) => r.json())
      .then((j) => { if (j.data) setMonthly(j.data); })
      .catch(() => {});
  }

  /* ========== 租户 ========== */

  async function loadTenants() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tenantSearch) params.set("search", tenantSearch);
      if (planFilter) params.set("plan", planFilter);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/tenants?${params}`);
      const json = await res.json();
      if (json.data) setTenants(json.data);
    } catch { toast.error("加载失败"); }
    finally { setLoading(false); }
  }

  async function updateTenant(id: string, updates: Record<string, unknown>) {
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

  function openDetail(t: Tenant) {
    setDetailTenant(t);
    setDetailOpen(true);
  }

  /* ========== 用户 ========== */

  async function loadUsers() {
    setUserLoading(true);
    try {
      const params = new URLSearchParams();
      if (userSearch) params.set("search", userSearch);
      const res = await fetch(`/api/admin/users?${params}`);
      const json = await res.json();
      if (json.data) setUsers(json.data);
    } catch { toast.error("加载失败"); }
    finally { setUserLoading(false); }
  }

  async function toggleUserDisable(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_disabled: !current }),
      });
      const json = await res.json();
      if (json.error) { toast.error(json.error); return; }
      toast.success(current ? "已禁用" : "已启用");
      loadUsers();
    } catch { toast.error("操作失败"); }
  }

  async function togglePlatformAdmin(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_platform_admin: !current }),
      });
      const json = await res.json();
      if (json.error) { toast.error(json.error); return; }
      toast.success(current ? "已取消平台管理员" : "已设为平台管理员");
      loadUsers();
    } catch { toast.error("操作失败"); }
  }

  async function updateUserRole(id: string, teamId: string, role: string) {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: teamId, role }),
      });
      const json = await res.json();
      if (json.error) { toast.error(json.error); return; }
      toast.success("角色已更新");
      loadUsers();
    } catch { toast.error("操作失败"); }
  }

  /* ========== 日志 ========== */

  async function loadActivityLogs() {
    setLogLoading(true);
    try {
      const params = new URLSearchParams();
      if (logSearch) params.set("search", logSearch);
      if (logTeamFilter) params.set("team_id", logTeamFilter);
      if (logUserFilter) params.set("user_id", logUserFilter);
      params.set("limit", "200");
      const res = await fetch(`/api/admin/activity-logs?${params}`);
      const json = await res.json();
      if (json.data) setActivityLogs(json.data);
    } catch { /* ignore */ }
    finally { setLogLoading(false); }
  }

  async function loadLoginLogs() {
    setLoginLogLoading(true);
    try {
      const params = new URLSearchParams();
      if (loginLogSearch) params.set("email", loginLogSearch);
      if (loginLogFilter && loginLogFilter !== "all") params.set("success", loginLogFilter);
      params.set("limit", "200");
      const res = await fetch(`/api/admin/login-logs?${params}`);
      const json = await res.json();
      if (json.data) setLoginLogs(json.data);
    } catch { /* ignore */ }
    finally { setLoginLogLoading(false); }
  }

  /* ========== 渲染 ========== */

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold text-black mb-6">运营管理后台</h1>

      {/* Tab 切换 */}
      <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 w-fit mb-6">
        {([
          ["overview", "概览"],
          ["tenants", "租户管理"],
          ["users", "用户管理"],
          ["logs", "操作日志"],
          ["loginLogs", "登录记录"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
              tab === key ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-black"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ========== 概览标签 ========== */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* 统计卡片 */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <p className="text-xs text-zinc-400 mb-1">MRR</p>
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
          {/* 趋势图 */}
          {monthly && <MonthlyChart data={monthly} />}
          {/* 状态分布 */}
          {stats && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="text-sm font-bold text-black mb-3">订阅状态分布</h3>
              <div className="flex gap-4 flex-wrap">
                {Object.entries(stats.statusCount).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[status] || "bg-zinc-100"}`}>
                      {statusNames[status] || status}
                    </span>
                    <span className="text-sm font-medium text-zinc-700">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== 租户管理标签 ========== */}
      {tab === "tenants" && (
        <div>
          {/* 筛选 */}
          <div className="flex items-center gap-3 mb-4">
            <input
              type="text"
              value={tenantSearch}
              onChange={(e) => setTenantSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") loadTenants(); }}
              placeholder="搜索租户名称..."
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-black w-48"
            />
            <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none">
              <option value="">全部方案</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none">
              <option value="">全部状态</option>
              <option value="trial">试用中</option>
              <option value="active">已激活</option>
              <option value="cancelled">已取消</option>
              <option value="expired">已过期</option>
            </select>
            <button onClick={loadTenants} className="text-xs text-zinc-400 hover:text-zinc-600">搜索</button>
          </div>

          {/* 列表 */}
          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-zinc-100 animate-pulse" />)}</div>
          ) : (
            <div className="space-y-2">
              {tenants.map((t) => (
                <div key={t.id} className={`rounded-xl border bg-white p-4 ${!t.is_active ? "border-red-200 bg-red-50/30" : "border-zinc-200"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => openDetail(t)} className="text-sm font-medium text-black hover:text-blue-600 transition-colors text-left">
                          {t.name}
                        </button>
                        {t.company_name && <span className="text-xs text-zinc-400">({t.company_name})</span>}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusColors[t.subscription_status] || "bg-zinc-100"}`}>
                          {statusNames[t.subscription_status] || t.subscription_status}
                        </span>
                        {!t.is_active && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">已停用</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                        <span>成员: {t.member_count}</span>
                        <span>内容: {t.content_count}</span>
                        <span>线索: {t.lead_count}</span>
                        <span>创建: {new Date(t.created_at).toLocaleDateString("zh-CN")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <select value={t.plan} onChange={(e) => updateTenant(t.id, { plan: e.target.value })} className="rounded border border-zinc-200 px-2 py-1 text-xs outline-none">
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                      <button
                        onClick={() => updateTenant(t.id, { is_active: !t.is_active })}
                        className={`text-xs px-2 py-1 rounded border ${t.is_active ? "border-red-200 text-red-500 hover:bg-red-50" : "border-green-200 text-green-600 hover:bg-green-50"}`}
                      >
                        {t.is_active ? "停用" : "启用"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {tenants.length === 0 && (
                <div className="text-center py-16"><p className="text-sm text-zinc-400">没有找到匹配的租户</p></div>
              )}
            </div>
          )}

          {/* 租户详情弹窗 */}
          <Dialog open={detailOpen} onOpenChange={(open) => { if (!open) setDetailOpen(false); }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>租户详情</DialogTitle>
              </DialogHeader>
              {detailTenant && (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-zinc-400">名称</span><p className="font-medium">{detailTenant.name}</p></div>
                    <div><span className="text-zinc-400">公司</span><p className="font-medium">{detailTenant.company_name || "-"}</p></div>
                    <div><span className="text-zinc-400">方案</span><p className="font-medium">{planNames[detailTenant.plan]}</p></div>
                    <div><span className="text-zinc-400">状态</span><p className="font-medium">{statusNames[detailTenant.subscription_status] || detailTenant.subscription_status}</p></div>
                    <div><span className="text-zinc-400">成员数</span><p className="font-medium">{detailTenant.member_count}</p></div>
                    <div><span className="text-zinc-400">内容数</span><p className="font-medium">{detailTenant.content_count}</p></div>
                    <div><span className="text-zinc-400">线索数</span><p className="font-medium">{detailTenant.lead_count}</p></div>
                    <div><span className="text-zinc-400">启用</span><p className="font-medium">{detailTenant.is_active ? "是" : "否"}</p></div>
                  </div>
                  <div><span className="text-zinc-400">试用到期</span><p className="font-medium">{detailTenant.trial_ends_at ? new Date(detailTenant.trial_ends_at).toLocaleDateString("zh-CN") : "-"}</p></div>
                  <div><span className="text-zinc-400">创建时间</span><p className="font-medium">{new Date(detailTenant.created_at).toLocaleString("zh-CN")}</p></div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* ========== 用户管理标签 ========== */}
      {tab === "users" && (
        <div>
          {/* 搜索 */}
          <div className="flex items-center gap-3 mb-4">
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") loadUsers(); }}
              placeholder="搜索用户名或邮箱..."
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-black w-56"
            />
            <button onClick={loadUsers} className="text-xs text-zinc-400 hover:text-zinc-600">搜索</button>
          </div>

          {/* 列表 */}
          {userLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-zinc-100 animate-pulse" />)}</div>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className={`rounded-xl border bg-white p-4 ${u.is_disabled ? "border-red-200 bg-red-50/30" : "border-zinc-200"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs text-white font-medium shrink-0">
                          {u.name?.charAt(0) || "?"}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-black">{u.name}</p>
                          <p className="text-xs text-zinc-400">{u.email}</p>
                        </div>
                        {u.is_platform_admin && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">平台管理员</span>
                        )}
                        {u.is_disabled && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">已禁用</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 ml-9 flex-wrap">
                        {u.teams.map((t) => (
                          <span key={t.team_id} className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500">
                            {t.team_name} · {roleLabels[t.role] || t.role}
                          </span>
                        ))}
                        <span className="text-xs text-zinc-300">{new Date(u.created_at).toLocaleDateString("zh-CN")} 注册</span>
                      </div>
                    </div>
                    {/* 操作按钮组 */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      {/* 平台管理员开关 */}
                      <button
                        onClick={() => togglePlatformAdmin(u.id, u.is_platform_admin)}
                        className={`text-xs px-2 py-1 rounded border whitespace-nowrap ${
                          u.is_platform_admin
                            ? "border-purple-200 text-purple-600 hover:bg-purple-50"
                            : "border-purple-200 text-purple-400 hover:bg-purple-50"
                        }`}
                      >
                        {u.is_platform_admin ? "取消管理员" : "设为管理员"}
                      </button>
                      {/* 角色修改（每个团队一个下拉） */}
                      {u.teams.length === 1 && (
                        <select
                          value={u.teams[0].role}
                          onChange={(e) => updateUserRole(u.id, u.teams[0].team_id, e.target.value)}
                          className="rounded border border-zinc-200 px-2 py-1 text-xs outline-none"
                        >
                          <option value="owner">拥有者</option>
                          <option value="admin">管理员</option>
                          <option value="editor">编辑者</option>
                          <option value="viewer">只读</option>
                        </select>
                      )}
                      {u.teams.length > 1 && (
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              const [teamId, role] = e.target.value.split("|");
                              updateUserRole(u.id, teamId, role);
                            }
                          }}
                          className="rounded border border-zinc-200 px-2 py-1 text-xs outline-none"
                        >
                          <option value="">修改角色...</option>
                          {u.teams.map((t) => (
                            <optgroup key={t.team_id} label={t.team_name}>
                              <option value={`${t.team_id}|owner`}>拥有者 {t.role === "owner" ? "✓" : ""}</option>
                              <option value={`${t.team_id}|admin`}>管理员 {t.role === "admin" ? "✓" : ""}</option>
                              <option value={`${t.team_id}|editor`}>编辑者 {t.role === "editor" ? "✓" : ""}</option>
                              <option value={`${t.team_id}|viewer`}>只读 {t.role === "viewer" ? "✓" : ""}</option>
                            </optgroup>
                          ))}
                        </select>
                      )}
                      {/* 禁用开关 */}
                      <button
                        onClick={() => toggleUserDisable(u.id, u.is_disabled)}
                        className={`text-xs px-2 py-1 rounded border whitespace-nowrap ${
                          u.is_disabled ? "border-green-200 text-green-600 hover:bg-green-50" : "border-red-200 text-red-500 hover:bg-red-50"
                        }`}
                      >
                        {u.is_disabled ? "启用" : "禁用"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="text-center py-16"><p className="text-sm text-zinc-400">没有找到匹配的用户</p></div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========== 操作日志标签 ========== */}
      {tab === "logs" && (
        <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <input
              type="text"
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") loadActivityLogs(); }}
              placeholder="搜索用户名/操作/详情..."
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-black w-56"
            />
            <input
              type="text"
              value={logTeamFilter}
              onChange={(e) => setLogTeamFilter(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") loadActivityLogs(); }}
              placeholder="团队 ID..."
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-black w-36"
            />
            <input
              type="text"
              value={logUserFilter}
              onChange={(e) => setLogUserFilter(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") loadActivityLogs(); }}
              placeholder="用户 ID..."
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-black w-36"
            />
            <button onClick={loadActivityLogs} className="text-xs text-zinc-400 hover:text-zinc-600">搜索</button>
            <span className="text-xs text-zinc-400">{activityLogs.length} 条记录</span>
          </div>

          {logLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-xl bg-zinc-100 animate-pulse" />)}</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                    <th className="px-4 py-2.5 text-xs font-medium text-zinc-500">时间</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-zinc-500">用户</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-zinc-500">操作</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-zinc-500">对象</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-zinc-500">详情</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-zinc-500">团队</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLogs.map((log) => (
                    <tr key={log.id} className="border-b border-zinc-100 hover:bg-zinc-50/50">
                      <td className="px-4 py-2.5 text-xs text-zinc-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("zh-CN")}
                      </td>
                      <td className="px-4 py-2.5 text-xs font-medium text-black">{log.user_name || "-"}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700">{log.action}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-zinc-500 max-w-[120px] truncate">{log.target || "-"}</td>
                      <td className="px-4 py-2.5 text-xs text-zinc-500 max-w-[200px] truncate">{log.details || "-"}</td>
                      <td className="px-4 py-2.5 text-xs text-zinc-400 font-mono">{log.team_id?.slice(0, 8) || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {activityLogs.length === 0 && (
                <div className="text-center py-16"><p className="text-sm text-zinc-400">暂无操作日志</p></div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========== 登录记录标签 ========== */}
      {tab === "loginLogs" && (
        <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <input
              type="text"
              value={loginLogSearch}
              onChange={(e) => setLoginLogSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") loadLoginLogs(); }}
              placeholder="搜索邮箱..."
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-black w-48"
            />
            <select value={loginLogFilter} onChange={(e) => setLoginLogFilter(e.target.value)} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none">
              <option value="all">全部</option>
              <option value="true">成功</option>
              <option value="false">失败</option>
            </select>
            <button onClick={loadLoginLogs} className="text-xs text-zinc-400 hover:text-zinc-600">搜索</button>
            <span className="text-xs text-zinc-400">{loginLogs.length} 条记录</span>
          </div>

          {loginLogLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-xl bg-zinc-100 animate-pulse" />)}</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                    <th className="px-4 py-2.5 text-xs font-medium text-zinc-500">时间</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-zinc-500">邮箱</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-zinc-500">状态</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-zinc-500">IP 地址</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-zinc-500">失败原因</th>
                  </tr>
                </thead>
                <tbody>
                  {loginLogs.map((log) => (
                    <tr key={log.id} className="border-b border-zinc-100 hover:bg-zinc-50/50">
                      <td className="px-4 py-2.5 text-xs text-zinc-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("zh-CN")}
                      </td>
                      <td className="px-4 py-2.5 text-xs font-medium text-black">{log.email}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          log.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                        }`}>
                          {log.success ? "成功" : "失败"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-zinc-500 font-mono">{log.ip_address || "-"}</td>
                      <td className="px-4 py-2.5 text-xs text-zinc-400 max-w-[200px] truncate">{log.error_reason || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loginLogs.length === 0 && (
                <div className="text-center py-16"><p className="text-sm text-zinc-400">暂无登录记录</p></div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
