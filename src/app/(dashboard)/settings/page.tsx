"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

type Tab = "info" | "members" | "apikeys";

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
  const [members, setMembers] = useState<Member[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [teamRes, membersRes, keysRes] = await Promise.all([
      fetch("/api/team"),
      fetch("/api/team/members"),
      fetch("/api/api-keys"),
    ]);
    const [t, m, k] = await Promise.all([teamRes.json(), membersRes.json(), keysRes.json()]);
    if (t.data) setTeam(t.data);
    if (m.data) setMembers(m.data);
    if (k.data) setApiKeys(k.data);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-zinc-400">加载中...</p>
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
            ["apikeys", "API 密钥"],
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
          {tab === "apikeys" && <ApiKeysTab apiKeys={apiKeys} onUpdate={loadData} />}
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
  const [message, setMessage] = useState("");

  async function save() {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, company_name: companyName, industry, logo_url: logoUrl }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.error) {
      setMessage("保存失败：" + json.error);
    } else {
      setMessage("保存成功");
      onUpdate();
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
        {message && (
          <span className={`text-sm ${message.includes("失败") ? "text-red-500" : "text-green-600"}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}

// ========== Tab 2：成员管理 ==========

function MembersTab({ members, onUpdate }: { members: Member[]; onUpdate: () => void }) {
  const [actionMsg, setActionMsg] = useState("");

  async function changeRole(memberId: string, role: string) {
    setActionMsg("");
    const res = await fetch(`/api/team/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const json = await res.json();
    if (json.error) setActionMsg(json.error);
    else onUpdate();
  }

  async function removeMember(memberId: string) {
    if (!confirm("确定要移除这位成员吗？")) return;
    setActionMsg("");
    const res = await fetch(`/api/team/members/${memberId}`, { method: "DELETE" });
    const json = await res.json();
    if (json.error) setActionMsg(json.error);
    else onUpdate();
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      {members.length === 0 ? (
        <div className="py-16 text-center text-sm text-zinc-400">暂无团队成员</div>
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
                      {Object.entries(roleLabels).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeMember(m.id)}
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
      {actionMsg && (
        <div className="border-t border-zinc-100 px-6 py-3 text-sm text-red-500">{actionMsg}</div>
      )}
    </div>
  );
}

// ========== Tab 3：API 密钥 ==========

function ApiKeysTab({ apiKeys, onUpdate }: { apiKeys: ApiKey[]; onUpdate: () => void }) {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function createKey() {
    if (!name.trim()) return;
    setCreating(true);
    await fetch("/api/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setName("");
    setCreating(false);
    onUpdate();
  }

  async function deleteKey(id: string) {
    if (!confirm("删除后该 API Key 将立即失效，确定删除？")) return;
    await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
    onUpdate();
  }

  async function copyKey(key: string) {
    await navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
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
          <div className="py-16 text-center text-sm text-zinc-400">
            还没有 API Key，创建一个吧
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
                    onClick={() => deleteKey(ak.id)}
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
    </div>
  );
}
