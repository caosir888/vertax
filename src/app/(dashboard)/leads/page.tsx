"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

const STATUS_COLUMNS = [
  { key: "new", label: "新线索", color: "bg-blue-50 border-blue-200" },
  { key: "contacted", label: "已联系", color: "bg-yellow-50 border-yellow-200" },
  { key: "qualified", label: "已确认", color: "bg-purple-50 border-purple-200" },
  { key: "proposal", label: "提案中", color: "bg-orange-50 border-orange-200" },
  { key: "won", label: "已成交", color: "bg-green-50 border-green-200" },
  { key: "lost", label: "已流失", color: "bg-zinc-50 border-zinc-200" },
];

const STATUS_LABELS: Record<string, string> = {
  new: "新线索",
  contacted: "已联系",
  qualified: "已确认",
  proposal: "提案中",
  won: "已成交",
  lost: "已流失",
};

function parseCSV(text: string) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const nameIdx = header.findIndex((h) => h === "姓名" || h === "name");
  if (nameIdx === -1) return [];
  const companyIdx = header.findIndex((h) => h === "公司" || h === "company");
  const emailIdx = header.findIndex((h) => h === "邮箱" || h === "email");
  const phoneIdx = header.findIndex((h) => h === "电话" || h === "phone");
  const sourceIdx = header.findIndex((h) => h === "来源" || h === "source");
  const notesIdx = header.findIndex((h) => h === "备注" || h === "notes");

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    return {
      name: cols[nameIdx] || "",
      company: companyIdx >= 0 ? cols[companyIdx] || "" : "",
      email: emailIdx >= 0 ? cols[emailIdx] || "" : "",
      phone: phoneIdx >= 0 ? cols[phoneIdx] || "" : "",
      source: sourceIdx >= 0 ? cols[sourceIdx] || "" : "",
      notes: notesIdx >= 0 ? cols[notesIdx] || "" : "",
    };
  });
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // 新建/编辑弹窗
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", source: "", notes: "" });
  const [saving, setSaving] = useState(false);

  // 导入
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);

  // 删除
  const [delOpen, setDelOpen] = useState(false);
  const [delId, setDelId] = useState("");

  // AI 画像
  const [profileMap, setProfileMap] = useState<Record<string, number>>({});
  const [profilingId, setProfilingId] = useState("");
  const [profileResult, setProfileResult] = useState<{
    score: number;
    company_summary: string;
    decision_maker_analysis: string;
    pain_point_match: string;
    recommended_approach: string;
    risk_factors: string;
  } | null>(null);

  useEffect(() => {
    loadLeads();
    loadScores();
  }, []);

  async function loadLeads() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/leads?${params}`);
      const json = await res.json();
      if (json.data) setLeads(json.data);
    } catch {
      toast.error("线索加载失败");
    } finally {
      setLoading(false);
    }
  }

  async function loadScores() {
    try {
      const res = await fetch("/api/leads?limit=200");
      const json = await res.json();
      if (json.data) {
        const scores: Record<string, number> = {};
        await Promise.all(
          (json.data as Lead[]).map(async (lead) => {
            try {
              const r = await fetch(`/api/leads/${lead.id}/profile`);
              const j = await r.json();
              if (j.data?.score) scores[lead.id] = j.data.score;
            } catch { /* skip */ }
          })
        );
        setProfileMap(scores);
      }
    } catch { /* skip */ }
  }

  async function generateProfile(leadId: string) {
    setProfilingId(leadId);
    setProfileResult(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/profile`, { method: "POST" });
      const json = await res.json();
      if (json.error) { toast.error(json.error); return; }
      setProfileResult(json.data);
      setProfileMap((prev) => ({ ...prev, [leadId]: json.data.score }));
      toast.success("画像生成完成");
    } catch {
      toast.error("画像生成失败");
    } finally {
      setProfilingId("");
    }
  }

  function getScoreBadge(score: number) {
    if (score >= 80) return { label: "高匹配", color: "bg-green-100 text-green-700" };
    if (score >= 50) return { label: "中等", color: "bg-yellow-100 text-yellow-700" };
    return { label: "低匹配", color: "bg-zinc-100 text-zinc-500" };
  }

  function openCreate() {
    setEditLead(null);
    setProfileResult(null);
    setForm({ name: "", company: "", email: "", phone: "", source: "", notes: "" });
    setDialogOpen(true);
  }

  function openEdit(lead: Lead) {
    setEditLead(lead);
    setProfileResult(null);
    // 加载已有画像
    fetch(`/api/leads/${lead.id}/profile`)
      .then((r) => r.json())
      .then((j) => { if (j.data) setProfileResult(j.data); })
      .catch(() => {});
    setForm({
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      notes: lead.notes,
    });
    setDialogOpen(true);
  }

  async function saveLead() {
    if (!form.name.trim()) {
      toast.error("姓名不能为空");
      return;
    }
    setSaving(true);

    try {
      let res: Response;
      if (editLead) {
        res = await fetch(`/api/leads/${editLead.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      const json = await res.json();
      if (json.error) { toast.error(json.error); return; }
      toast.success(editLead ? "已更新" : "已创建");
      setDialogOpen(false);
      loadLeads();
    } catch {
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function moveStatus(lead: Lead, newStatus: string) {
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.error) { toast.error(json.error); return; }
      loadLeads();
    } catch {
      toast.error("更新失败");
    }
  }

  async function deleteLead() {
    try {
      const res = await fetch(`/api/leads/${delId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.error) { toast.error(json.error); return; }
      toast.success("已删除");
      setDelOpen(false);
      loadLeads();
    } catch {
      toast.error("删除失败");
    }
  }

  async function handleImport() {
    const rows = parseCSV(importText);
    if (rows.length === 0) {
      toast.error("未识别到有效数据，请确保 CSV 包含「姓名」列");
      return;
    }
    setImporting(true);
    try {
      const res = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const json = await res.json();
      if (json.error) toast.error(json.error);
      else {
        toast.success(`成功导入 ${json.data.imported} 条线索`);
        setImportOpen(false);
        setImportText("");
        loadLeads();
      }
    } catch {
      toast.error("导入失败");
    } finally {
      setImporting(false);
    }
  }

  function handleExport() {
    window.open("/api/leads/export", "_blank");
  }

  const leadsByStatus = (status: string) => leads.filter((l) => l.status === status);

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-[1400px]">
        {/* 头部 */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-black">线索管理</h1>
            <p className="mt-2 text-sm text-zinc-500">
              轻量级 CRM：线索录入、状态流转、看板管理
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)} className="rounded-xl">
              导入
            </Button>
            <Button variant="outline" onClick={handleExport} className="rounded-xl">
              导出
            </Button>
            <Button onClick={openCreate} className="rounded-xl bg-black text-white hover:bg-zinc-800">
              新建线索
            </Button>
          </div>
        </div>

        {/* 搜索 */}
        <div className="mt-6 flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") loadLeads(); }}
            placeholder="搜索姓名、公司、邮箱..."
            className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm focus:border-black focus:outline-none w-64"
          />
          <Button variant="outline" onClick={loadLeads} className="rounded-xl text-sm">
            搜索
          </Button>
        </div>

        {/* 看板 */}
        {loading ? (
          <div className="mt-8 grid grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-xl bg-zinc-50 p-4 space-y-3">
                <div className="h-5 w-16 rounded bg-zinc-200 animate-pulse" />
                <div className="h-24 rounded-xl bg-zinc-100 animate-pulse" />
                <div className="h-20 rounded-xl bg-zinc-100 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {STATUS_COLUMNS.map((col) => {
              const items = leadsByStatus(col.key);
              return (
                <div
                  key={col.key}
                  className={`rounded-xl border ${col.color} p-3 min-h-[200px]`}
                >
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-sm font-medium text-zinc-700">
                      {col.label}
                    </h3>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs text-zinc-400">
                      {items.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {items.map((lead) => (
                      <div
                        key={lead.id}
                        className="rounded-xl bg-white border border-zinc-200 p-3 shadow-sm hover:border-zinc-300 transition-colors cursor-pointer group"
                        onClick={() => openEdit(lead)}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-black truncate flex-1">
                            {lead.name}
                          </p>
                          {profileMap[lead.id] && (
                            <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${getScoreBadge(profileMap[lead.id]).color}`}>
                              {profileMap[lead.id]}
                            </span>
                          )}
                        </div>
                        {lead.company && (
                          <p className="text-xs text-zinc-500 truncate mt-0.5">
                            {lead.company}
                          </p>
                        )}
                        {lead.email && (
                          <p className="text-xs text-zinc-400 truncate mt-0.5">
                            {lead.email}
                          </p>
                        )}

                        {/* 状态流转按钮 */}
                        <div className="mt-2 pt-2 border-t border-zinc-100 flex flex-wrap gap-1">
                          {col.key !== "won" && col.key !== "lost" && (
                            <>
                              {col.key === "new" && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveStatus(lead, "contacted"); }}
                                  className="text-xs text-yellow-600 hover:text-yellow-800"
                                >
                                  联系 →
                                </button>
                              )}
                              {col.key === "contacted" && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveStatus(lead, "qualified"); }}
                                  className="text-xs text-purple-600 hover:text-purple-800"
                                >
                                  确认 →
                                </button>
                              )}
                              {col.key === "qualified" && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveStatus(lead, "proposal"); }}
                                  className="text-xs text-orange-600 hover:text-orange-800"
                                >
                                  提案 →
                                </button>
                              )}
                              {col.key === "proposal" && (
                                <>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); moveStatus(lead, "won"); }}
                                    className="text-xs text-green-600 hover:text-green-800"
                                  >
                                    成交 →
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); moveStatus(lead, "lost"); }}
                                    className="text-xs text-zinc-400 hover:text-red-500"
                                  >
                                    流失
                                  </button>
                                </>
                              )}
                            </>
                          )}
                          {(col.key === "won" || col.key === "lost") && (
                            <button
                              onClick={(e) => { e.stopPropagation(); moveStatus(lead, "new"); }}
                              className="text-xs text-zinc-400 hover:text-blue-500"
                            >
                              重新打开
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setDelId(lead.id); setDelOpen(true); }}
                            className="text-xs text-zinc-300 hover:text-red-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    ))}

                    {items.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-2xl mb-2">📭</p>
                        <p className="text-xs text-zinc-400">暂无线索</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 新建/编辑弹窗 */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editLead ? "编辑线索" : "新建线索"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">姓名 *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="联系人姓名"
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">公司</label>
                <input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="公司名称"
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">邮箱</label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">电话</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="手机号"
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">来源</label>
                <input
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  placeholder="官网、展会、转介绍..."
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">备注</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="跟进记录或备注"
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* AI 客户画像 */}
            {editLead && (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                    🤖 AI 客户画像
                  </h4>
                  <button
                    onClick={() => generateProfile(editLead.id)}
                    disabled={profilingId === editLead.id}
                    className="text-xs rounded-lg bg-black text-white px-3 py-1 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                  >
                    {profilingId === editLead.id ? "分析中..." : profileResult ? "重新分析" : "AI 分析"}
                  </button>
                </div>

                {profileResult ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400">匹配度</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${getScoreBadge(profileResult.score).color}`}>
                        {profileResult.score}/100 {getScoreBadge(profileResult.score).label}
                      </span>
                    </div>
                    {profileResult.company_summary && (
                      <p className="text-xs text-zinc-600">
                        <span className="font-medium text-zinc-500">公司分析：</span>
                        {profileResult.company_summary}
                      </p>
                    )}
                    {profileResult.decision_maker_analysis && (
                      <p className="text-xs text-zinc-600">
                        <span className="font-medium text-zinc-500">决策人分析：</span>
                        {profileResult.decision_maker_analysis}
                      </p>
                    )}
                    {profileResult.pain_point_match && (
                      <p className="text-xs text-zinc-600">
                        <span className="font-medium text-zinc-500">痛点匹配：</span>
                        {profileResult.pain_point_match}
                      </p>
                    )}
                    {profileResult.recommended_approach && (
                      <p className="text-xs text-zinc-600">
                        <span className="font-medium text-zinc-500">跟进建议：</span>
                        {profileResult.recommended_approach}
                      </p>
                    )}
                    {profileResult.risk_factors && (
                      <p className="text-xs text-zinc-600">
                        <span className="font-medium text-zinc-500">风险提示：</span>
                        {profileResult.risk_factors}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400">点击「AI 分析」生成客户画像，包括 ICP 匹配评分、公司分析、跟进建议等。</p>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">
                取消
              </Button>
              <Button onClick={saveLead} disabled={saving} className="rounded-xl bg-black text-white hover:bg-zinc-800">
                {saving ? "保存中..." : "保存"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 导入弹窗 */}
        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>导入 CSV</DialogTitle>
            </DialogHeader>
            <div>
              <p className="text-xs text-zinc-400 mb-2">
                CSV 需包含标题行，至少包含「姓名」列。支持列：姓名、公司、邮箱、电话、来源、备注
              </p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={10}
                placeholder="姓名,公司,邮箱,电话,来源,备注&#10;张三,XX科技,zhang@xx.com,13800000000,展会,意向客户"
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm font-mono focus:border-black focus:outline-none resize-none"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setImportOpen(false)} className="rounded-xl">
                取消
              </Button>
              <Button onClick={handleImport} disabled={importing} className="rounded-xl bg-black text-white hover:bg-zinc-800">
                {importing ? "导入中..." : "导入"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 删除确认 */}
        <ConfirmDialog
          open={delOpen}
          onOpenChange={setDelOpen}
          title="删除线索"
          description="确定删除这条线索吗？此操作不可撤销。"
          confirmLabel="删除"
          onConfirm={deleteLead}
        />
      </div>
    </div>
  );
}
