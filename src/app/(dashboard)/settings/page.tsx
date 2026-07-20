"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";

// ========== 类型 ==========

interface Team {
  id: string;
  name: string;
  company_name: string;
  industry: string;
  logo_url: string;
  created_at: string;
}

interface Member {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  role: string;
  created_at: string;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
}

type Tab = "info" | "members" | "subscription" | "apikeys" | "activity" | "loginLogs";

interface ActivityLog {
  id: string;
  user_name: string;
  action: string;
  target: string;
  details: string;
  created_at: string;
}

const roleLabels: Record<string, string> = {
  owner: "拥有者",
  admin: "管理员",
  editor: "编辑者",
  viewer: "只读",
};

const industryOptions = [
  "制造业", "科技/IT", "贸易/跨境电商", "金融服务", "医疗健康",
  "教育培训", "房地产", "零售/消费品", "物流/供应链", "其他",
];

// ========== 页面主体 ==========

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("info");
  const [team, setTeam] = useState<Team | null>(null);
  const [sub, setSub] = useState<{
    plan: string; subscription_status: string; trial_ends_at: string | null;
    limits: { maxMembers: number; maxSites: number; maxContent: number; maxAIGenerations: number };
  } | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loginLogs, setLoginLogs] = useState<{ id: string; email: string; success: boolean; ip_address: string; user_agent: string; error_reason: string; created_at: string }[]>([]);
  const [loginLogFilter, setLoginLogFilter] = useState("");
  const [loginLogLoading, setLoginLogLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (tab === "loginLogs") loadLoginLogs(); }, [tab, loginLogFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [teamRes, membersRes, keysRes, logRes, subRes] = await Promise.all([
        fetch("/api/team"),
        fetch("/api/team/members"),
        fetch("/api/api-keys"),
        fetch("/api/activity-logs"),
        fetch("/api/subscription"),
      ]);
      const [t, m, k, l, s] = await Promise.all([teamRes.json(), membersRes.json(), keysRes.json(), logRes.json(), subRes.json()]);
      if (t.data) setTeam(t.data);
      if (m.data) setMembers(m.data);
      if (k.data) setApiKeys(k.data);
      if (l.data) setActivityLogs(l.data);
      if (s.data) setSub(s.data);
    } catch {
      toast.error("设置信息加载失败");
    } finally {
      setLoading(false);
    }
  }

  async function loadLoginLogs() {
    setLoginLogLoading(true);
    try {
      const params = new URLSearchParams();
      if (loginLogFilter && loginLogFilter !== "all") params.set("success", loginLogFilter);
      params.set("limit", "100");
      const res = await fetch(`/api/login-logs?${params}`);
      const json = await res.json();
      if (json.data) setLoginLogs(json.data);
    } catch {
      // ignore
    } finally {
      setLoginLogLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-8 sm:px-8 sm:py-12">
        <div className="mx-auto max-w-3xl space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-80 rounded-lg" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-black">设置</h1>

        {/* Tab 切换 */}
        <div className="mt-6 flex gap-1 rounded-lg bg-zinc-100 p-1 w-fit">
          {([
            ["info", "团队信息"],
            ["members", "成员管理"],
            ["subscription", "订阅"],
            ["apikeys", "API 密钥"],
            ["activity", "操作日志"],
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

        <div className="mt-6">
          {tab === "info" && <TeamInfoTab team={team} onUpdate={loadData} />}
          {tab === "members" && <MembersTab members={members} onUpdate={loadData} />}
          {tab === "subscription" && sub && (
            <SubscriptionTab sub={sub} onUpdate={loadData} />
          )}
          {tab === "apikeys" && <ApiKeysTab apiKeys={apiKeys} onUpdate={loadData} />}
          {tab === "activity" && (
            <div className="rounded-xl border border-zinc-200 bg-white">
              {activityLogs.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm text-zinc-400">暂无操作记录</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 px-6 py-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-500 mt-0.5">
                        {log.user_name?.charAt(0) || "?"}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm text-zinc-700">
                          <span className="font-medium">{log.user_name}</span>
                          <span className="text-zinc-400"> {log.action}</span>
                          {log.target && <span className="text-zinc-500"> · {log.target}</span>}
                        </p>
                        {log.details && <p className="text-xs text-zinc-400 truncate">{log.details}</p>}
                        <p className="text-xs text-zinc-300 mt-0.5">
                          {new Date(log.created_at).toLocaleString("zh-CN")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "loginLogs" && (
            <div>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <select
                  value={loginLogFilter}
                  onChange={(e) => setLoginLogFilter(e.target.value)}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none"
                >
                  <option value="all">全部</option>
                  <option value="true">成功</option>
                  <option value="false">失败</option>
                </select>
                <button onClick={loadLoginLogs} className="text-xs text-zinc-400 hover:text-zinc-600">刷新</button>
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
                        <th className="px-4 py-2.5 text-xs font-medium text-zinc-500">说明</th>
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
                    <div className="text-center py-16">
                      <p className="text-sm text-zinc-400">暂无登录记录</p>
                      <p className="text-xs text-zinc-300 mt-1">登录记录将在下次登录后显示</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ========== Tab 1：团队信息 ==========

function TeamInfoTab({ team, onUpdate }: { team: Team | null; onUpdate: () => void }) {
  const [name, setName] = useState(team?.name || "");
  const [companyName, setCompanyName] = useState(team?.company_name || "");
  const [industry, setIndustry] = useState(team?.industry || "");
  const [logoUrl, setLogoUrl] = useState(team?.logo_url || "");
  const [saving, setSaving] = useState(false);

  // 同步外部 props 变化
  const teamId = team?.id;
  useEffect(() => {
    setName(team?.name || "");
    setCompanyName(team?.company_name || "");
    setIndustry(team?.industry || "");
    setLogoUrl(team?.logo_url || "");
  }, [teamId]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, company_name: companyName, industry, logo_url: logoUrl }),
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
      } else {
        toast.success("保存成功");
        onUpdate();
      }
    } catch {
      toast.error("网络错误，请重试");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-5">
      <div>
        <label className="block text-sm font-medium text-zinc-700">团队名称</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700">公司名称</label>
        <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1" placeholder="可选" />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700">行业</label>
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm bg-white focus:border-black focus:outline-none"
        >
          <option value="">请选择（可选）</option>
          {industryOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700">Logo URL</label>
        <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="mt-1" placeholder="https://..." />
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving || !name.trim()}>
          {saving ? "保存中..." : "保存修改"}
        </Button>
      </div>
    </div>
  );
}

// ========== Tab 2：成员管理 ==========

function MembersTab({ members, onUpdate }: { members: Member[]; onUpdate: () => void }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string>("");
  const [removeName, setRemoveName] = useState("");

  async function changeRole(memberId: string, role: string) {
    try {
      const res = await fetch(`/api/team/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const json = await res.json();
      if (json.error) toast.error(json.error);
      else { toast.success("角色已更新"); onUpdate(); }
    } catch {
      toast.error("网络错误");
    }
  }

  function promptRemove(memberId: string, name: string) {
    setRemoveTarget(memberId);
    setRemoveName(name);
    setConfirmOpen(true);
  }

  async function removeMember() {
    try {
      const res = await fetch(`/api/team/members/${removeTarget}`, { method: "DELETE" });
      const json = await res.json();
      if (json.error) toast.error(json.error);
      else { toast.success("成员已移除"); onUpdate(); }
    } catch {
      toast.error("网络错误");
    }
  }

  return (
    <>
    <div className="rounded-xl border border-zinc-200 bg-white">
      {members.length === 0 ? (
        <div className="py-16 text-center">
          <div className="text-2xl">👥</div>
          <p className="mt-2 text-sm text-zinc-400">暂无团队成员</p>
          <p className="mt-1 text-xs text-zinc-300">后续将支持邀请链接加入团队</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-100">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-600">
                  {m.user_name?.charAt(0) || "?"}
                </span>
                <div>
                  <p className="text-sm font-medium text-black">
                    {m.user_name}
                    {m.role === "owner" && <span className="ml-1 text-xs text-amber-500">(我)</span>}
                  </p>
                  <p className="text-xs text-zinc-400">{m.user_email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {m.role !== "owner" ? (
                  <>
                    <select
                      value={m.role}
                      onChange={(e) => changeRole(m.id, e.target.value)}
                      className="rounded-lg border border-zinc-200 px-2 py-1 text-xs bg-white focus:border-black focus:outline-none"
                    >
                      {Object.entries(roleLabels).filter(([val]) => val !== "owner").map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => promptRemove(m.id, m.user_name)}
                      className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      移除
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-zinc-400">拥有者</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="移除成员"
        description={`确定要移除 ${removeName} 吗？移除后该成员将无法访问团队数据。`}
        confirmLabel="移除"
        onConfirm={removeMember}
      />
    </>
  );
}

// ========== Tab 3：API 密钥 ==========

function ApiKeysTab({ apiKeys, onUpdate }: { apiKeys: ApiKey[]; onUpdate: () => void }) {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [delOpen, setDelOpen] = useState(false);
  const [delTarget, setDelTarget] = useState("");

  async function createKey() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const json = await res.json();
      if (json.error) toast.error(json.error);
      else { toast.success("API Key 已创建"); setName(""); onUpdate(); }
    } catch {
      toast.error("网络错误");
    } finally {
      setCreating(false);
    }
  }

  async function deleteKey() {
    try {
      await fetch(`/api/api-keys/${delTarget}`, { method: "DELETE" });
      toast.success("API Key 已删除");
      onUpdate();
    } catch {
      toast.error("网络错误");
    }
  }

  async function copyKey(key: string) {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(key);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } else {
      toast.error("请使用 HTTPS 访问");
    }
  }

  return (
    <div className="space-y-6">
      {/* 创建新 Key */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h3 className="text-sm font-medium text-black">创建新 API Key</h3>
        <div className="mt-3 flex gap-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Key 名称，如：开发环境"
            className="flex-1"
          />
          <Button onClick={createKey} disabled={creating || !name.trim()}>
            {creating ? "创建中..." : "创建"}
          </Button>
        </div>
      </div>

      {/* Key 列表 */}
      <div className="rounded-xl border border-zinc-200 bg-white">
        {apiKeys.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-2xl">🔑</div>
            <p className="mt-2 text-sm text-zinc-400">还没有 API Key</p>
            <p className="mt-1 text-xs text-zinc-300">创建 API Key 后可用于外部系统接入</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {apiKeys.map((ak) => (
              <div key={ak.id} className="flex items-center justify-between px-6 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-black">{ak.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-zinc-400 truncate">
                    {ak.key.slice(0, 6)}...{ak.key.slice(-4)}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-300">
                    {new Date(ak.created_at).toLocaleString("zh-CN")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => copyKey(ak.key)}
                    className="rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 transition-colors"
                  >
                    {copied === ak.key ? "已复制" : "复制"}
                  </button>
                  <button
                    onClick={() => { setDelTarget(ak.id); setDelOpen(true); }}
                    className="rounded-md px-2 py-1 text-xs text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={delOpen}
        onOpenChange={setDelOpen}
        title="删除 API Key"
        description="删除后该 API Key 将立即失效，使用该 Key 的应用将无法访问 API。确定删除？"
        confirmLabel="删除"
        onConfirm={deleteKey}
      />
    </div>
  );
}

// ========== 订阅标签 ==========

const planNames: Record<string, string> = { free: "Free", pro: "Pro", enterprise: "Enterprise" };
const statusNames: Record<string, string> = { trial: "试用中", active: "已激活", cancelled: "已取消", expired: "已过期" };
const statusColors: Record<string, string> = { trial: "bg-blue-100 text-blue-700", active: "bg-green-100 text-green-700", cancelled: "bg-yellow-100 text-yellow-700", expired: "bg-red-100 text-red-700" };

function SubscriptionTab({ sub, onUpdate }: { sub: { plan: string; subscription_status: string; trial_ends_at: string | null; limits: { maxMembers: number; maxSites: number; maxContent: number; maxAIGenerations: number } }; onUpdate: () => void }) {
  const [upgrading, setUpgrading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const trialLeft = sub.trial_ends_at ? Math.max(0, Math.ceil((new Date(sub.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  async function handleUpgrade(plan: string) {
    const planLabel = plan === "pro" ? "Pro ($29/月)" : "Enterprise ($99/月)";
    if (!confirm(`确认升级到 ${planLabel}？\n（模拟支付，不会产生真实费用）`)) return;
    setUpgrading(true);
    try {
      const res = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (json.error) { alert(json.error); return; }
      alert(`升级成功！交易ID: ${json.data.transaction_id}`);
      onUpdate();
    } catch { alert("升级失败"); }
    finally { setUpgrading(false); }
  }

  async function handleCancel() {
    if (!confirm("确定取消订阅？取消后现有功能仍可用到当前周期结束。")) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST" });
      const json = await res.json();
      if (json.error) { alert(json.error); return; }
      alert("已取消订阅");
      onUpdate();
    } catch { alert("取消失败"); }
    finally { setCancelling(false); }
  }

  return (
    <div className="space-y-4">
      {/* 当前方案 */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-black">当前方案</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[sub.subscription_status] || "bg-zinc-100 text-zinc-500"}`}>
            {statusNames[sub.subscription_status] || sub.subscription_status}
          </span>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold text-black">{planNames[sub.plan]}</span>
        </div>
        {sub.subscription_status === "trial" && trialLeft > 0 && (
          <p className="text-sm text-blue-600">试用剩余 {trialLeft} 天</p>
        )}
        {sub.subscription_status === "trial" && trialLeft === 0 && (
          <p className="text-sm text-red-500">试用已到期，请升级方案</p>
        )}
      </div>

      {/* 使用限制 */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h3 className="text-sm font-bold text-black mb-3">方案限制</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between p-2 bg-zinc-50 rounded"><span>成员数</span><span className="font-medium">{sub.limits.maxMembers}</span></div>
          <div className="flex justify-between p-2 bg-zinc-50 rounded"><span>独立站</span><span className="font-medium">{sub.limits.maxSites}</span></div>
          <div className="flex justify-between p-2 bg-zinc-50 rounded"><span>内容数</span><span className="font-medium">{sub.limits.maxContent}</span></div>
          <div className="flex justify-between p-2 bg-zinc-50 rounded"><span>AI生成/天</span><span className="font-medium">{sub.limits.maxAIGenerations}</span></div>
        </div>
      </div>

      {/* 操作 */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h3 className="text-sm font-bold text-black mb-3">方案操作</h3>
        <div className="flex flex-wrap gap-2">
          {sub.plan !== "pro" && (
            <button onClick={() => handleUpgrade("pro")} disabled={upgrading} className="rounded-lg bg-black text-white px-4 py-2 text-sm hover:bg-zinc-800 disabled:opacity-50">
              {upgrading ? "处理中..." : "升级到 Pro ($29/月)"}
            </button>
          )}
          {sub.plan !== "enterprise" && (
            <button onClick={() => handleUpgrade("enterprise")} disabled={upgrading} className="rounded-lg bg-zinc-800 text-white px-4 py-2 text-sm hover:bg-zinc-700 disabled:opacity-50">
              {upgrading ? "处理中..." : "升级到 Enterprise ($99/月)"}
            </button>
          )}
          {sub.subscription_status === "active" && (
            <button onClick={handleCancel} disabled={cancelling} className="rounded-lg border border-red-200 text-red-500 px-4 py-2 text-sm hover:bg-red-50 disabled:opacity-50">
              {cancelling ? "处理中..." : "取消订阅"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
