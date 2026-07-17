"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

/* ========== 类型 ========== */

interface BuzzAccount {
  id: string;
  platform: string;
  account_name: string;
  account_handle: string;
  access_token?: string;
  status: string;
}

interface BuzzMention {
  id: string;
  monitor_id: string;
  source: string;
  url: string;
  title: string;
  snippet: string;
  sentiment: string;
  confidence: number;
  status: string;
  platforms: string[];
  account_id: string | null;
  interactions: number;
  mention_date: string;
  created_at: string;
  buzz_monitors?: { name: string } | null;
  buzz_accounts?: { platform: string; account_name: string; account_handle: string } | null;
}

interface BuzzMonitor {
  id: string;
  name: string;
  type: "brand" | "competitor" | "keyword";
  keywords: string[];
  description: string;
  status: string;
  created_at: string;
}

interface BuzzAlert {
  id: string;
  monitor_id: string;
  name: string;
  type: string;
  threshold: number;
  enabled: boolean;
  last_triggered_at: string | null;
  created_at: string;
  buzz_monitors?: { name: string } | null;
}

/* ========== 常量 ========== */

const SUB_NAV = [
  { key: "publish", label: "内容发布", icon: "📡" },
  { key: "config", label: "发布配置", icon: "⚙️" },
];

const PLATFORM_ICONS: Record<string, { icon: string; label: string; color: string }> = {
  linkedin: { icon: "L", label: "LinkedIn", color: "bg-blue-600" },
  twitter: { icon: "T", label: "Twitter/X", color: "bg-zinc-900" },
  facebook: { icon: "F", label: "Facebook", color: "bg-blue-700" },
  youtube: { icon: "Y", label: "YouTube", color: "bg-red-600" },
};

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-600",
  published: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-600",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "草稿",
  published: "已发布",
  failed: "发布失败",
};

const TYPE_LABELS: Record<string, string> = {
  brand: "品牌", competitor: "竞品", keyword: "关键词",
};
const TYPE_COLORS: Record<string, string> = {
  brand: "bg-blue-100 text-blue-700",
  competitor: "bg-orange-100 text-orange-700",
  keyword: "bg-purple-100 text-purple-700",
};
const ALERT_TYPE_LABELS: Record<string, string> = {
  sentiment_drop: "情感下降", volume_spike: "音量激增",
};

/* ========== 主页面 ========== */

export default function BuzzPage() {
  const [activeTab, setActiveTab] = useState("publish");

  return (
    <div className="flex h-full">
      <aside className="w-48 border-r border-zinc-200 bg-white p-3 flex-shrink-0">
        <h3 className="mb-2 px-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">声量引擎</h3>
        {SUB_NAV.map((item) => (
          <button key={item.key} onClick={() => setActiveTab(item.key)}
            className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors ${activeTab === item.key ? "bg-black text-white" : "text-zinc-600 hover:bg-zinc-100"}`}>
            <span>{item.icon}</span>{item.label}
          </button>
        ))}
      </aside>
      <div className="flex-1 overflow-auto p-6">
        {activeTab === "publish" && <PublishTab />}
        {activeTab === "config" && <ConfigTab onBackToPublish={() => setActiveTab("publish")} />}
      </div>
    </div>
  );
}

/* ========== Tab 1: 内容发布（声量枢纽） ========== */

function PublishTab() {
  const [contents, setContents] = useState<BuzzMention[]>([]);
  const [accounts, setAccounts] = useState<BuzzAccount[]>([]);
  const [monitors, setMonitors] = useState<BuzzMonitor[]>([]);
  const [stats, setStats] = useState({ totalContent: 0, published: 0, totalInteractions: 0, authorizedAccounts: 0 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showAccountAdd, setShowAccountAdd] = useState(false);
  const [showKeywordGen, setShowKeywordGen] = useState(false);
  const [saving, setSaving] = useState(false);

  // 表单
  const [form, setForm] = useState({ monitor_id: "", title: "", snippet: "", platforms: [] as string[], account_id: "" });
  const [accForm, setAccForm] = useState({ platform: "facebook", account_name: "", account_handle: "" });
  const [kwInput, setKwInput] = useState("");
  const [kwResult, setKwResult] = useState<Record<string, string[]> | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (search) params.set("search", search);

      const [mRes, aRes, oRes, moRes] = await Promise.all([
        fetch(`/api/buzz/mentions?${params.toString()}`),
        fetch("/api/buzz/accounts"),
        fetch("/api/buzz/overview"),
        fetch("/api/buzz/monitors"),
      ]);
      const [mJson, aJson, oJson, moJson] = await Promise.all([mRes.json(), aRes.json(), oRes.json(), moRes.json()]);
      if (mJson.data) setContents(mJson.data);
      if (aJson.data) setAccounts(aJson.data);
      if (oJson.data) setStats(oJson.data);
      if (moJson.data) setMonitors(moJson.data);
    } catch { toast.error("加载失败"); }
    finally { setLoading(false); }
  }, [filterStatus, search]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleAdd() {
    if (!form.title.trim()) { toast.error("请输入标题"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/buzz/mentions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, status: "draft" }) });
      const json = await res.json();
      if (json.error) { toast.error(json.error); return; }
      toast.success("内容已创建");
      setShowAdd(false);
      setForm({ monitor_id: "", title: "", snippet: "", platforms: [], account_id: "" });
      fetchAll();
    } catch { toast.error("创建失败"); }
    finally { setSaving(false); }
  }

  async function handlePublish(id: string, platforms: string[]) {
    if (platforms.length === 0) {
      toast.error("请先关联内容到平台账号"); return;
    }
    try {
      await fetch(`/api/buzz/mentions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "published" }) });
      toast.success("已发布");
      fetchAll();
    } catch { toast.error("发布失败"); }
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除此内容？")) return;
    await fetch(`/api/buzz/mentions/${id}`, { method: "DELETE" });
    toast.success("已删除");
    setSelected(null);
    fetchAll();
  }

  async function handleAddAccount() {
    if (!accForm.account_name.trim()) { toast.error("请输入账号名称"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/buzz/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(accForm) });
      const json = await res.json();
      if (json.error) { toast.error(json.error); return; }
      toast.success("账号已添加");
      setShowAccountAdd(false);
      setAccForm({ platform: "facebook", account_name: "", account_handle: "" });
      fetchAll();
    } catch { toast.error("添加失败"); }
    finally { setSaving(false); }
  }

  async function handleDeleteAccount(id: string) {
    if (!confirm("确定删除此授权账号？")) return;
    await fetch(`/api/buzz/accounts/${id}`, { method: "DELETE" });
    toast.success("已删除");
    fetchAll();
  }

  async function handleKeywordGen() {
    if (!kwInput.trim()) { toast.error("请输入品牌或话题"); return; }
    setKwResult(null);
    try {
      const res = await fetch("/api/buzz/keywords", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: kwInput }) });
      const json = await res.json();
      if (json.error) { toast.error(json.error); return; }
      setKwResult(json.data);
    } catch { toast.error("AI 生成失败"); }
  }

  function handleExport() {
    window.open("/api/buzz/export", "_blank");
  }

  const selectedContent = contents.find((c) => c.id === selected);

  const platformOptions = ["linkedin", "twitter", "facebook", "youtube"];
  const togglePlatform = (p: string) => {
    setForm((f) => ({ ...f, platforms: f.platforms.includes(p) ? f.platforms.filter((x) => x !== p) : [...f.platforms, p] }));
  };

  return (
    <div className="space-y-5">
      {/* 标题区 */}
      <div>
        <h2 className="text-xl font-bold text-zinc-900">声量枢纽</h2>
        <p className="text-sm text-zinc-500 mt-0.5">社交媒体管理与品牌传播</p>
      </div>

      {/* 操作栏 */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors">
          <span>+</span> 产品内容引擎
        </button>
        <button onClick={handleExport}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
          导出 CSV
        </button>
        <button onClick={() => setShowKeywordGen(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
          AI 关键词生成
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="内容数" value={stats.totalContent} color="bg-white border" />
        <StatCard label="已发布" value={stats.published} color="bg-green-50 text-green-700" />
        <StatCard label="总互动" value={stats.totalInteractions} color="bg-white border" />
        <StatCard label="已授权账号" value={stats.authorizedAccounts} color="bg-blue-50 text-blue-700" />
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* 内容列表（左 2/3） */}
        <div className="col-span-2 bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
            <h3 className="text-sm font-semibold text-zinc-700">内容列表</h3>
            <div className="flex gap-2">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-md border border-zinc-200 px-2 py-1 text-xs outline-none">
                <option value="">全部状态</option>
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
                <option value="failed">发布失败</option>
              </select>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索..." className="w-40 rounded-md border border-zinc-200 px-2 py-1 text-xs outline-none" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-6 w-6 border-2 border-zinc-200 border-t-black rounded-full" />
            </div>
          ) : contents.length === 0 ? (
            <div className="text-center py-20 text-zinc-400">
              <p className="text-3xl mb-2">📝</p>
              <p className="text-sm">暂无内容</p>
              <p className="text-xs mt-1">点击「产品内容引擎」创建第一条内容</p>
            </div>
          ) : (
            <div>
              {contents.map((c) => (
                <div key={c.id}
                  onClick={() => setSelected(c.id === selected ? null : c.id)}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-zinc-50 cursor-pointer transition-colors hover:bg-zinc-50 ${selected === c.id ? "bg-zinc-50" : ""}`}>
                  <input type="checkbox" checked={selected === c.id} onChange={() => {}} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-800 truncate">{c.title}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_BADGE[c.status] || STATUS_BADGE.draft}`}>
                        {STATUS_LABEL[c.status] || "草稿"}
                      </span>
                    </div>
                    {c.snippet && <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{c.snippet}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {(c.platforms || []).map((p) => (
                      <span key={p} className={`inline-flex w-5 h-5 items-center justify-center rounded text-[10px] font-bold text-white ${PLATFORM_ICONS[p]?.color || "bg-zinc-400"}`}
                        title={PLATFORM_ICONS[p]?.label || p}>{PLATFORM_ICONS[p]?.icon || p[0].toUpperCase()}</span>
                    ))}
                  </div>
                  <span className="text-xs text-zinc-400 shrink-0 w-36 text-right">{formatDate(c.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 右侧面板 */}
        <div className="space-y-4">
          {/* 内容详情 */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-zinc-700 mb-3">
              {selectedContent ? selectedContent.title : "选择内容查看详情"}
            </h3>
            {selectedContent ? (
              <div className="space-y-3">
                <div className="text-xs text-zinc-500 space-y-1">
                  <p>状态：<span className={`px-1.5 py-0.5 rounded ${STATUS_BADGE[selectedContent.status]}`}>{STATUS_LABEL[selectedContent.status]}</span></p>
                  <p>创建时间：{formatDate(selectedContent.created_at)}</p>
                  <p>互动数：{selectedContent.interactions || 0}</p>
                  <p>监控器：{selectedContent.buzz_monitors?.name || "-"}</p>
                  {selectedContent.snippet && <p className="mt-2 text-zinc-600">{selectedContent.snippet}</p>}
                </div>
                <div className="flex gap-2 pt-2 border-t border-zinc-100">
                  {selectedContent.status === "draft" && (
                    <button onClick={() => handlePublish(selectedContent.id, selectedContent.platforms || [])}
                      className="px-3 py-1 text-xs bg-black text-white rounded-md hover:bg-zinc-800">发布</button>
                  )}
                  <button onClick={() => handleDelete(selectedContent.id)}
                    className="px-3 py-1 text-xs text-red-500 hover:bg-red-50 rounded-md">删除</button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-400">点击左侧内容查看详情</p>
            )}
          </div>

          {/* 已授权账号 */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-700">已授权账号</h3>
              <button onClick={() => setShowAccountAdd(true)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium">+ 添加</button>
            </div>
            {accounts.length === 0 ? (
              <p className="text-xs text-zinc-400">暂无授权账号</p>
            ) : (
              <div className="space-y-2">
                {accounts.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-sm">
                    <span className={`inline-flex w-5 h-5 items-center justify-center rounded text-[10px] font-bold text-white ${PLATFORM_ICONS[a.platform]?.color || "bg-zinc-400"}`}>
                      {PLATFORM_ICONS[a.platform]?.icon || a.platform[0].toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-700 truncate">{a.account_name}</p>
                      {a.account_handle && <p className="text-[10px] text-zinc-400">{a.account_handle}</p>}
                    </div>
                    <button onClick={() => handleDeleteAccount(a.id)}
                      className="text-[10px] text-red-400 hover:text-red-600">移除</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 新建内容弹窗 */}
      {showAdd && (
        <Dialog onClose={() => setShowAdd(false)} title="产品内容引擎">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">标题 *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="内容标题" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-black" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">摘要</label>
              <textarea value={form.snippet} onChange={(e) => setForm({ ...form, snippet: e.target.value })}
                placeholder="内容摘要..." rows={3} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-black resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">发布平台</label>
              <div className="flex gap-2">
                {platformOptions.map((p) => (
                  <button key={p} onClick={() => togglePlatform(p)}
                    className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs border transition-colors ${form.platforms.includes(p) ? "bg-black text-white border-black" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}>
                    <span className={`inline-flex w-4 h-4 items-center justify-center rounded-sm text-[9px] font-bold text-white ${PLATFORM_ICONS[p]?.color || "bg-zinc-400"}`}>{PLATFORM_ICONS[p]?.icon}</span>
                    {PLATFORM_ICONS[p]?.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">关联监控器</label>
              <select value={form.monitor_id} onChange={(e) => setForm({ ...form, monitor_id: e.target.value })}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-black">
                <option value="">不关联</option>
                {monitors.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-md">取消</button>
            <button onClick={handleAdd} disabled={saving}
              className="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-zinc-800 disabled:opacity-50">{saving ? "创建中..." : "创建内容"}</button>
          </div>
        </Dialog>
      )}

      {/* 添加账号弹窗 */}
      {showAccountAdd && (
        <Dialog onClose={() => setShowAccountAdd(false)} title="添加授权账号">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">平台</label>
              <select value={accForm.platform} onChange={(e) => setAccForm({ ...accForm, platform: e.target.value })}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-black">
                {platformOptions.map((p) => (<option key={p} value={p}>{PLATFORM_ICONS[p]?.label}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">账号名称 *</label>
              <input type="text" value={accForm.account_name} onChange={(e) => setAccForm({ ...accForm, account_name: e.target.value })}
                placeholder="例如：TD Painting" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-black" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">用户名/Handle</label>
              <input type="text" value={accForm.account_handle} onChange={(e) => setAccForm({ ...accForm, account_handle: e.target.value })}
                placeholder="例如：@Lynn27346316512" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-black" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowAccountAdd(false)} className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-md">取消</button>
            <button onClick={handleAddAccount} disabled={saving}
              className="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-zinc-800 disabled:opacity-50">{saving ? "添加中..." : "添加账号"}</button>
          </div>
        </Dialog>
      )}

      {/* AI 关键词生成弹窗 */}
      {showKeywordGen && (
        <Dialog onClose={() => { setShowKeywordGen(false); setKwResult(null); }} title="AI 关键词生成">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">品牌/话题</label>
              <div className="flex gap-2">
                <input type="text" value={kwInput} onChange={(e) => setKwInput(e.target.value)}
                  placeholder="输入品牌名或话题..." className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-black" />
                <button onClick={handleKeywordGen}
                  className="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-zinc-800 whitespace-nowrap">生成</button>
              </div>
            </div>
            {kwResult && (
              <div className="space-y-3 mt-4">
                {kwResult.brand_keywords && (
                  <div>
                    <p className="text-xs font-medium text-zinc-600 mb-1">品牌关键词</p>
                    <div className="flex flex-wrap gap-1">
                      {kwResult.brand_keywords.map((k, i) => (<span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{k}</span>))}
                    </div>
                  </div>
                )}
                {kwResult.competitor_keywords && (
                  <div>
                    <p className="text-xs font-medium text-zinc-600 mb-1">竞品关键词</p>
                    <div className="flex flex-wrap gap-1">
                      {kwResult.competitor_keywords.map((k, i) => (<span key={i} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">{k}</span>))}
                    </div>
                  </div>
                )}
                {kwResult.trending_keywords && (
                  <div>
                    <p className="text-xs font-medium text-zinc-600 mb-1">热门趋势词</p>
                    <div className="flex flex-wrap gap-1">
                      {kwResult.trending_keywords.map((k, i) => (<span key={i} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{k}</span>))}
                    </div>
                  </div>
                )}
                {kwResult.longtail_keywords && (
                  <div>
                    <p className="text-xs font-medium text-zinc-600 mb-1">长尾关键词</p>
                    <div className="flex flex-wrap gap-1">
                      {kwResult.longtail_keywords.map((k, i) => (<span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{k}</span>))}
                    </div>
                  </div>
                )}
                {kwResult.summary && <p className="text-xs text-zinc-500 border-t border-zinc-100 pt-2 mt-2">{kwResult.summary}</p>}
              </div>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}

/* ========== Tab 2: 发布配置（发布通道接入） ========== */

const ALL_CHANNELS = [
  { key: "twitter", label: "X (Twitter)", icon: "X", color: "bg-zinc-900", desc: "" },
  { key: "facebook", label: "Facebook", icon: "F", color: "bg-blue-700", desc: "" },
  { key: "linkedin", label: "LinkedIn", icon: "L", color: "bg-blue-600", desc: "分享接入，可直接用于传播" },
  { key: "youtube", label: "YouTube", icon: "Y", color: "bg-red-600", desc: "" },
  { key: "tiktok", label: "TikTok", icon: "T", color: "bg-zinc-900", desc: "" },
];

function ConfigTab({ onBackToPublish }: { onBackToPublish: () => void }) {
  const [accounts, setAccounts] = useState<BuzzAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCredentials, setShowCredentials] = useState<string | null>(null); // channel key
  const [credForm, setCredForm] = useState({ api_key: "", account_handle: "" });
  const [saving, setSaving] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/buzz/accounts");
      const json = await res.json();
      if (json.data) setAccounts(json.data);
    } catch { toast.error("加载失败"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  function getAccount(platform: string) {
    return accounts.find((a) => a.platform === platform);
  }

  function openCredentials(channel: string) {
    const existing = getAccount(channel);
    setCredForm({
      api_key: existing?.access_token || "",
      account_handle: existing?.account_handle || "",
    });
    setShowCredentials(channel);
  }

  async function handleConnect(channel: string) {
    if (!credForm.account_handle.trim()) { toast.error("请输入账号用户名/Handle"); return; }
    setSaving(true);
    try {
      const existing = getAccount(channel);
      const url = existing ? `/api/buzz/accounts/${existing.id}` : "/api/buzz/accounts";
      const method = existing ? "PATCH" : "POST";
      const body = existing
        ? { access_token: credForm.api_key, account_handle: credForm.account_handle, status: "active" }
        : { platform: channel, account_name: ALL_CHANNELS.find((c) => c.key === channel)?.label || channel, account_handle: credForm.account_handle, access_token: credForm.api_key };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (json.error) { toast.error(json.error); return; }
      toast.success(existing ? "凭证已更新" : "已接入");
      setShowCredentials(null);
      fetchAccounts();
    } catch { toast.error("操作失败"); }
    finally { setSaving(false); }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-zinc-200 border-t-black rounded-full" /></div>;
  }

  const connectedCount = accounts.filter((a) => a.status === "active").length;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* 头部 */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBackToPublish}
            className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-black transition-colors">
            <span>←</span> 返回声量枢纽
          </button>
        </div>
        <h2 className="text-xl font-bold text-zinc-900">发布通道接入</h2>
        <p className="text-sm text-zinc-500 mt-0.5">先让关键渠道可用，再回到声量枢纽持续推进发布。</p>
      </div>

      {/* 当前可用 */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700">
        当前可直接发布 <span className="font-bold">{connectedCount}</span> 个渠道
      </div>

      {/* 渠道卡片 */}
      <div className="grid gap-3">
        {ALL_CHANNELS.map((ch) => {
          const acc = getAccount(ch.key);
          const isConnected = acc && acc.status === "active";
          return (
            <div key={ch.key} className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`inline-flex w-8 h-8 items-center justify-center rounded-lg text-sm font-bold text-white ${ch.color}`}>
                  {ch.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-zinc-800">{ch.label}</p>
                  {isConnected ? (
                    <p className="text-xs text-green-600">{acc.account_handle || "已接通"}</p>
                  ) : (
                    <p className="text-xs text-zinc-400">未接入</p>
                  )}
                  {ch.desc && isConnected && (
                    <p className="text-xs text-zinc-400 mt-0.5">{ch.desc}</p>
                  )}
                  {ch.key === "linkedin" && isConnected && (
                    <p className="text-xs text-zinc-400 mt-0.5">发布时可直接打开分享窗口，一键带出内容，适合作为补充传播通道。</p>
                  )}
                </div>
              </div>
              <button onClick={() => openCredentials(ch.key)}
                className={`px-4 py-1.5 text-xs font-medium rounded-md border transition-colors ${isConnected ? "border-zinc-200 text-zinc-600 hover:bg-zinc-50" : "border-black bg-black text-white hover:bg-zinc-800"}`}>
                {isConnected ? "更新接入" : "去接通"}
              </button>
            </div>
          );
        })}
      </div>

      {/* 快速上手 */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-zinc-700 mb-3">快速上手</h3>
        <ol className="space-y-2 text-sm text-zinc-600">
          <li className="flex gap-2">
            <span className="font-bold text-zinc-400 shrink-0">1.</span>
            先确认目标平台的发布方式：OAuth 直连或 API 直发。
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-zinc-400 shrink-0">2.</span>
            完成接入并校验成功后，即可在首页继续推进发布。
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-zinc-400 shrink-0">3.</span>
            将内容推进到该渠道后，先看"发布结果"再决定是否扩量到下一个渠道。
          </li>
        </ol>
      </div>

      {/* 安全说明 */}
      <p className="text-xs text-zinc-400 text-center">
        说明：凭证仅用于已授权内容发布，并会安全存储。
      </p>

      {/* 凭证弹窗 */}
      {showCredentials && (
        <Dialog onClose={() => setShowCredentials(null)}
          title={`接入 ${ALL_CHANNELS.find((c) => c.key === showCredentials)?.label || showCredentials}`}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">用户名 / Handle *</label>
              <input type="text" value={credForm.account_handle} onChange={(e) => setCredForm({ ...credForm, account_handle: e.target.value })}
                placeholder="例如：@Lynn27346316512" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-black" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">API Key / Access Token</label>
              <input type="text" value={credForm.api_key} onChange={(e) => setCredForm({ ...credForm, api_key: e.target.value })}
                placeholder="粘贴平台提供的 API Key 或 Access Token" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-black" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowCredentials(null)} className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-md">取消</button>
            <button onClick={() => handleConnect(showCredentials)} disabled={saving}
              className="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-zinc-800 disabled:opacity-50">{saving ? "保存中..." : "确认接入"}</button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

/* ========== 共享组件 ========== */

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className={`rounded-lg p-4 ${color}`}>
      <p className="text-sm opacity-70">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function Dialog({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 animate-in zoom-in-95 max-h-[90vh] overflow-auto">
        <h3 className="text-lg font-bold text-zinc-800 mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}
