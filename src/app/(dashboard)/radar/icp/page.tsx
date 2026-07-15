"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";

interface ICPData {
  name: string;
  industries: string[];
  company_size: string;
  roles: string[];
  pain_points: string[];
  budget_range: string;
  tech_stack: string[];
  geo_regions: string[];
  description: string;
}

const defaultICP: ICPData = {
  name: "默认画像",
  industries: [],
  company_size: "",
  roles: [],
  pain_points: [],
  budget_range: "",
  tech_stack: [],
  geo_regions: [],
  description: "",
};

function TagInput({ label, value, onChange, placeholder }: { label: string; value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  };

  const remove = (item: string) => {
    onChange(value.filter((v) => v !== item));
  };

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-zinc-700">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
        <button type="button" onClick={add} className="px-3 py-2 text-sm border rounded-lg hover:bg-zinc-50">
          添加
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((item) => (
            <span key={item} className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-100 rounded-md text-xs">
              {item}
              <button onClick={() => remove(item)} className="text-zinc-400 hover:text-red-500">&times;</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ICPPage() {
  const [icp, setIcp] = useState<ICPData>(defaultICP);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/icp")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setIcp({ ...defaultICP, ...json.data });
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!icp.industries.length) {
      toast.error("请至少填写目标行业");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/icp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(icp),
      });
      const json = await res.json();
      if (json.data) {
        toast.success("ICP 画像已保存");
      } else {
        toast.error(json.error || "保存失败");
      }
    } catch {
      toast.error("保存失败，请重试");
    }
    setSaving(false);
  };

  const tabs = [
    { href: "/radar", label: "总览", active: false },
    { href: "/radar/icp", label: "目标客户画像", active: true },
    { href: "/radar/discover", label: "新发现", active: false },
    { href: "/leads", label: "线索库", active: false },
  ];

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">目标客户画像</h1>
          <p className="text-sm text-zinc-500 mt-1">确认系统按什么画像找客户</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 text-sm bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 font-medium"
        >
          {saving ? "保存中..." : "保存画像"}
        </button>
      </div>

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

      <div className="bg-white border rounded-xl p-6 space-y-5">
        <TagInput label="目标行业" value={icp.industries} onChange={(v) => setIcp({ ...icp, industries: v })} placeholder="例如: SaaS, 制造业, 金融科技" />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">公司规模</label>
          <select
            value={icp.company_size}
            onChange={(e) => setIcp({ ...icp, company_size: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-200"
          >
            <option value="">不限</option>
            <option value="1-10">1-10 人 (初创)</option>
            <option value="11-50">11-50 人 (小型)</option>
            <option value="51-200">51-200 人 (中型)</option>
            <option value="201-1000">201-1000 人 (大型)</option>
            <option value="1000+">1000+ 人 (企业级)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">预算范围</label>
          <select
            value={icp.budget_range}
            onChange={(e) => setIcp({ ...icp, budget_range: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-200"
          >
            <option value="">不限</option>
            <option value="$1K-$10K">$1K - $10K / 年</option>
            <option value="$10K-$50K">$10K - $50K / 年</option>
            <option value="$50K-$100K">$50K - $100K / 年</option>
            <option value="$100K+">$100K+ / 年</option>
          </select>
        </div>

        <TagInput label="目标角色/职位" value={icp.roles} onChange={(v) => setIcp({ ...icp, roles: v })} placeholder="例如: CTO, Marketing Director, VP Sales" />

        <TagInput label="客户痛点" value={icp.pain_points} onChange={(v) => setIcp({ ...icp, pain_points: v })} placeholder="例如: 获客成本高, 数据分散, 转化率低" />

        <TagInput label="技术栈偏好" value={icp.tech_stack} onChange={(v) => setIcp({ ...icp, tech_stack: v })} placeholder="例如: Salesforce, HubSpot, AWS" />

        <TagInput label="目标地区" value={icp.geo_regions} onChange={(v) => setIcp({ ...icp, geo_regions: v })} placeholder="例如: 北美, 欧洲, 东南亚" />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">补充说明</label>
          <textarea
            value={icp.description}
            onChange={(e) => setIcp({ ...icp, description: e.target.value })}
            rows={3}
            placeholder="其他关于理想客户的描述..."
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-200 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
