"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

interface Opportunity {
  id: string;
  name: string;
  company: string;
  contact_name: string;
  lead_id?: string;
  stage: string;
  deal_value: number;
  probability: number;
  expected_close_date: string | null;
  products_interested: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface OppStats {
  total_count: number;
  total_pipeline_value: number;
  weighted_pipeline_value: number;
  stage_counts: Record<string, number>;
  stage_values: Record<string, number>;
}

const STAGE_COLUMNS = [
  { key: "initial_contact", label: "初步接触", color: "bg-blue-50 border-blue-200" },
  { key: "needs_confirmation", label: "需求确认", color: "bg-yellow-50 border-yellow-200" },
  { key: "proposal_quote", label: "方案报价", color: "bg-purple-50 border-purple-200" },
  { key: "negotiation", label: "谈判", color: "bg-orange-50 border-orange-200" },
  { key: "won", label: "成交", color: "bg-green-50 border-green-200" },
  { key: "lost", label: "丢单", color: "bg-zinc-50 border-zinc-200" },
];

const STAGE_LABELS: Record<string, string> = {
  initial_contact: "初步接触",
  needs_confirmation: "需求确认",
  proposal_quote: "方案报价",
  negotiation: "谈判",
  won: "成交",
  lost: "丢单",
};

function formatMoney(v: number) {
  if (v >= 10000) return `¥${(v / 10000).toFixed(1)}万`;
  return `¥${v.toLocaleString()}`;
}

function OpportunitiesInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [stats, setStats] = useState<OppStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // 新建/编辑弹窗
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOpp, setEditOpp] = useState<Opportunity | null>(null);
  const [form, setForm] = useState({
    name: "",
    company: "",
    contact_name: "",
    deal_value: 0,
    probability: 10,
    expected_close_date: "",
    products_interested: "",
    notes: "",
    stage: "initial_contact",
  });
  const [saving, setSaving] = useState(false);

  // 删除
  const [delOpen, setDelOpen] = useState(false);
  const [delId, setDelId] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  // 从线索转商机：检查 URL query param
  useEffect(() => {
    const leadId = searchParams.get("lead_id");
    if (leadId) {
      // 获取线索信息预填表单
      fetch(`/api/leads/${leadId}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.data) {
            setForm({
              name: (json.data.company || json.data.name) + " 商机",
              company: json.data.company || "",
              contact_name: json.data.name || "",
              deal_value: 0,
              probability: 10,
              expected_close_date: "",
              products_interested: "",
              notes: "",
              stage: "initial_contact",
            });
            setEditOpp({ ...json.data, lead_id: json.data.id } as unknown as Opportunity);
            setDialogOpen(true);
          }
        })
        .catch(() => {});
    }
  }, [searchParams]);

  async function loadAll() {
    setLoading(true);
    try {
      const [oppRes, statsRes] = await Promise.all([
        fetch("/api/opportunities"),
        fetch("/api/opportunities/stats"),
      ]);
      const oppJson = await oppRes.json();
      const statsJson = await statsRes.json();
      if (oppJson.data) setOpportunities(oppJson.data);
      if (statsJson.data) setStats(statsJson.data);
    } catch {
      toast.error("加载失败");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditOpp(null);
    setForm({
      name: "",
      company: "",
      contact_name: "",
      deal_value: 0,
      probability: 10,
      expected_close_date: "",
      products_interested: "",
      notes: "",
      stage: "initial_contact",
    });
    setDialogOpen(true);
  }

  function openEdit(opp: Opportunity) {
    setEditOpp(opp);
    setForm({
      name: opp.name,
      company: opp.company,
      contact_name: opp.contact_name,
      deal_value: opp.deal_value,
      probability: opp.probability,
      expected_close_date: opp.expected_close_date || "",
      products_interested: opp.products_interested,
      notes: opp.notes,
      stage: opp.stage,
    });
    setDialogOpen(true);
  }

  async function saveOpp() {
    if (!form.name.trim()) {
      toast.error("商机名称不能为空");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = { ...form };
      if (editOpp?.id && !(editOpp as unknown as { lead_id?: string }).lead_id) {
        // 正常编辑
        const res = await fetch(`/api/opportunities/${editOpp.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (json.error) { toast.error(json.error); return; }
        toast.success("已更新");
      } else {
        // 新建（包括从线索转化）
        if (editOpp && (editOpp as unknown as { lead_id?: string }).lead_id) {
          body.lead_id = (editOpp as unknown as { lead_id?: string }).lead_id;
        }
        const res = await fetch("/api/opportunities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (json.error) { toast.error(json.error); return; }
        toast.success("商机已创建");
      }
      setDialogOpen(false);
      loadAll();
    } catch {
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function moveStage(opp: Opportunity, newStage: string) {
    try {
      const res = await fetch(`/api/opportunities/${opp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      const json = await res.json();
      if (json.error) { toast.error(json.error); return; }
      loadAll();
    } catch {
      toast.error("更新失败");
    }
  }

  async function deleteOpp() {
    try {
      const res = await fetch(`/api/opportunities/${delId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.error) { toast.error(json.error); return; }
      toast.success("已删除");
      setDelOpen(false);
      loadAll();
    } catch {
      toast.error("删除失败");
    }
  }

  const oppsByStage = (stage: string) => opportunities.filter((o) => o.stage === stage);

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-[1400px]">
        {/* 头部 */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-black">采购机会</h1>
            <p className="mt-2 text-sm text-zinc-500">
              商机 Pipeline：追踪从初步接触到成交的完整流程
            </p>
          </div>
          <Button onClick={openCreate} className="rounded-xl bg-black text-white hover:bg-zinc-800">
            新建商机
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-zinc-400">总商机数</p>
            <p className="text-2xl font-bold text-zinc-800">{stats?.total_count ?? "..."}</p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-zinc-400">管道总值</p>
            <p className="text-2xl font-bold text-blue-600">
              {stats ? formatMoney(stats.total_pipeline_value) : "..."}
            </p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-zinc-400">加权管道值</p>
            <p className="text-2xl font-bold text-amber-600">
              {stats ? formatMoney(stats.weighted_pipeline_value) : "..."}
            </p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-zinc-400">预计成交</p>
            <p className="text-2xl font-bold text-green-600">
              {stats?.stage_counts.won ?? "..."}
            </p>
          </div>
        </div>

        {/* 搜索 */}
        <div className="mt-6 flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") loadAll(); }}
            placeholder="搜索商机名称、公司..."
            className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm focus:border-black focus:outline-none w-64"
          />
          <Button variant="outline" onClick={loadAll} className="rounded-xl text-sm">
            搜索
          </Button>
        </div>

        {/* Pipeline 看板 */}
        {loading ? (
          <div className="mt-8 grid grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-xl bg-zinc-50 p-4 space-y-3">
                <div className="h-5 w-16 rounded bg-zinc-200 animate-pulse" />
                <div className="h-20 rounded-xl bg-zinc-100 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {STAGE_COLUMNS.map((col) => {
              const items = oppsByStage(col.key);
              return (
                <div
                  key={col.key}
                  className={`rounded-xl border ${col.color} p-3 min-h-[200px]`}
                >
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-sm font-medium text-zinc-700">{col.label}</h3>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs text-zinc-400">
                      {items.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {items.map((opp) => (
                      <div
                        key={opp.id}
                        className="rounded-xl bg-white border border-zinc-200 p-3 shadow-sm hover:border-zinc-300 transition-colors cursor-pointer group"
                        onClick={() => openEdit(opp)}
                      >
                        <p className="text-sm font-medium text-black truncate">{opp.name}</p>
                        {opp.company && (
                          <p className="text-xs text-zinc-500 truncate mt-0.5">{opp.company}</p>
                        )}
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <span className="font-semibold text-zinc-700">
                            {formatMoney(opp.deal_value)}
                          </span>
                          <span className="text-zinc-400">{opp.probability}%</span>
                        </div>
                        {opp.expected_close_date && (
                          <p className="text-xs text-zinc-400 mt-1">
                            预计：{opp.expected_close_date}
                          </p>
                        )}

                        {/* 阶段流转按钮 */}
                        <div className="mt-2 pt-2 border-t border-zinc-100 flex flex-wrap gap-1">
                          {col.key !== "won" && col.key !== "lost" && (
                            <>
                              {col.key === "initial_contact" && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveStage(opp, "needs_confirmation"); }}
                                  className="text-xs text-yellow-600 hover:text-yellow-800"
                                >
                                  确认需求 →
                                </button>
                              )}
                              {col.key === "needs_confirmation" && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveStage(opp, "proposal_quote"); }}
                                  className="text-xs text-purple-600 hover:text-purple-800"
                                >
                                  报价 →
                                </button>
                              )}
                              {col.key === "proposal_quote" && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveStage(opp, "negotiation"); }}
                                  className="text-xs text-orange-600 hover:text-orange-800"
                                >
                                  谈判 →
                                </button>
                              )}
                              {col.key === "negotiation" && (
                                <>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); moveStage(opp, "won"); }}
                                    className="text-xs text-green-600 hover:text-green-800"
                                  >
                                    成交 →
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); moveStage(opp, "lost"); }}
                                    className="text-xs text-zinc-400 hover:text-red-500"
                                  >
                                    丢单
                                  </button>
                                </>
                              )}
                            </>
                          )}
                          {(col.key === "won" || col.key === "lost") && (
                            <button
                              onClick={(e) => { e.stopPropagation(); moveStage(opp, "initial_contact"); }}
                              className="text-xs text-zinc-400 hover:text-blue-500"
                            >
                              重新打开
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setDelId(opp.id); setDelOpen(true); }}
                            className="text-xs text-zinc-300 hover:text-red-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    ))}

                    {items.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-2xl mb-2">💼</p>
                        <p className="text-xs text-zinc-400">暂无商机</p>
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
              <DialogTitle>
                {editOpp && (editOpp as unknown as { lead_id?: string }).lead_id
                  ? "从线索转化商机"
                  : editOpp
                  ? "编辑商机"
                  : "新建商机"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">商机名称 *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="商机名称"
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">公司</label>
                  <input
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="公司名称"
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">联系人</label>
                  <input
                    value={form.contact_name}
                    onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                    placeholder="联系人"
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">金额</label>
                  <input
                    type="number"
                    value={form.deal_value}
                    onChange={(e) => setForm({ ...form, deal_value: Number(e.target.value) })}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">概率 %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.probability}
                    onChange={(e) => setForm({ ...form, probability: Number(e.target.value) })}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">预计成交</label>
                  <input
                    type="date"
                    value={form.expected_close_date}
                    onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  />
                </div>
              </div>
              {editOpp && (
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">阶段</label>
                  <select
                    value={form.stage}
                    onChange={(e) => setForm({ ...form, stage: e.target.value })}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  >
                    {STAGE_COLUMNS.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">意向产品</label>
                <input
                  value={form.products_interested}
                  onChange={(e) => setForm({ ...form, products_interested: e.target.value })}
                  placeholder="感兴趣的产品/服务"
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">备注</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="附加备注"
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">
                取消
              </Button>
              <Button onClick={saveOpp} disabled={saving} className="rounded-xl bg-black text-white hover:bg-zinc-800">
                {saving ? "保存中..." : "保存"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 删除确认 */}
        <ConfirmDialog
          open={delOpen}
          onOpenChange={setDelOpen}
          title="删除商机"
          description="确定删除这个商机吗？此操作不可撤销。"
          confirmLabel="删除"
          onConfirm={deleteOpp}
        />
      </div>
    </div>
  );
}

export default function OpportunitiesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-zinc-400">加载中...</div>}>
      <OpportunitiesInner />
    </Suspense>
  );
}
