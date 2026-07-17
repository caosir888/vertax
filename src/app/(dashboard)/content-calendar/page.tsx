"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Clock, Globe, CalendarDays } from "lucide-react";
import Link from "next/link";

interface ContentItem {
  id: string;
  title: string;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  updated_at: string;
  platform?: string;
  url?: string;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

const DAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

export default function ContentCalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [items, setItems] = useState<ContentItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      const res = await fetch("/api/content/calendar?limit=200");
      const json = await res.json();
      if (json.data) setItems(json.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
    setSelectedDate(null);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
    setSelectedDate(null);
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const dateStr = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const itemsByDate: Record<string, ContentItem[]> = {};
  for (const item of items) {
    const key = (item.published_at || item.scheduled_at || item.updated_at).substring(0, 10);
    if (!itemsByDate[key]) itemsByDate[key] = [];
    itemsByDate[key].push(item);
  }

  const selectedItems = selectedDate ? (itemsByDate[selectedDate] || []) : [];
  const scheduledCount = items.filter((i) => i.status === "scheduled").length;
  const publishedCount = items.filter((i) => i.status === "published").length;

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-black">内容日历</h1>
          <p className="text-sm text-zinc-500">规划与管理你的发布时间线</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Globe className="h-4 w-4 text-green-500" />
            <span className="text-zinc-600">已发布 <strong>{publishedCount}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-zinc-600">已排期 <strong>{scheduledCount}</strong></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 日历 */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white overflow-hidden">
          {/* 月导航 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
            <button onClick={prevMonth} className="p-1 rounded hover:bg-zinc-100">
              <ChevronLeft className="h-5 w-5 text-zinc-500" />
            </button>
            <span className="text-sm font-semibold text-black">
              {year}年 {MONTH_NAMES[month]}
            </span>
            <button onClick={nextMonth} className="p-1 rounded hover:bg-zinc-100">
              <ChevronRight className="h-5 w-5 text-zinc-500" />
            </button>
          </div>

          {/* 星期头 */}
          <div className="grid grid-cols-7 border-b border-zinc-100">
            {DAY_LABELS.map((d, i) => (
              <div key={i} className={`py-2 text-center text-xs font-medium ${i === 0 || i === 6 ? "text-zinc-400" : "text-zinc-500"}`}>
                {d}
              </div>
            ))}
          </div>

          {/* 日期格 */}
          <div className="grid grid-cols-7">
            {/* 空白填充 */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square border-b border-r border-zinc-50 bg-zinc-50/50" />
            ))}

            {/* 日期 */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const key = dateStr(d);
              const hasItems = itemsByDate[key]?.length || 0;
              const isToday = key === new Date().toISOString().substring(0, 10);
              const isSelected = key === selectedDate;

              return (
                <button
                  key={d}
                  onClick={() => { setSelectedDate(isSelected ? null : key); }}
                  className={`aspect-square border-b border-r border-zinc-50 flex flex-col items-center justify-start pt-1.5 transition-colors ${
                    isSelected ? "bg-black text-white" : isToday ? "bg-zinc-100" : "hover:bg-zinc-50"
                  }`}
                >
                  <span className={`text-xs font-medium ${isSelected ? "text-white" : isToday ? "text-black" : "text-zinc-600"}`}>
                    {d}
                  </span>
                  {hasItems > 0 && (
                    <span className={`mt-0.5 text-[10px] px-1 rounded-full ${
                      isSelected ? "bg-white text-black" : "bg-zinc-200 text-zinc-600"
                    }`}>
                      {hasItems}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 当日详情 */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-black mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            {selectedDate ? selectedDate : "点击日期查看详情"}
          </h3>

          {!selectedDate && (
            <p className="text-sm text-zinc-400 text-center py-8">选择日历中的日期<br />查看当天内容</p>
          )}

          {selectedDate && selectedItems.length === 0 && (
            <p className="text-sm text-zinc-400 text-center py-8">当天暂无内容</p>
          )}

          {selectedDate && selectedItems.length > 0 && (
            <div className="space-y-2">
              {selectedItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/content/${item.id}`}
                  className="block rounded-lg border border-zinc-100 p-3 hover:bg-zinc-50 transition-colors"
                >
                  <p className="text-sm font-medium text-black truncate">{item.title || "无标题"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      item.status === "published" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-600"
                    }`}>
                      {item.status === "published" ? "已发布" : "已排期"}
                    </span>
                    {item.platform && <span className="text-xs text-zinc-400">{item.platform}</span>}
                  </div>
                  {item.scheduled_at && item.status === "scheduled" && (
                    <p className="text-xs text-zinc-400 mt-1">
                      计划: {new Date(item.scheduled_at).toLocaleString("zh-CN")}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* 统计概览 */}
          <div className="mt-4 pt-4 border-t border-zinc-100">
            <h4 className="text-xs font-medium text-zinc-500 mb-2">本月概览</h4>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-zinc-50 py-2">
                <p className="text-lg font-bold text-black">
                  {items.filter((i) => {
                    const d = (i.published_at || i.scheduled_at || "");
                    return d.substring(0, 7) === dateStr(1).substring(0, 7) && i.status === "published";
                  }).length}
                </p>
                <p className="text-[10px] text-zinc-400">已发布</p>
              </div>
              <div className="rounded-lg bg-zinc-50 py-2">
                <p className="text-lg font-bold text-blue-600">
                  {items.filter((i) => {
                    const d = (i.scheduled_at || "");
                    return d.substring(0, 7) === dateStr(1).substring(0, 7) && i.status === "scheduled";
                  }).length}
                </p>
                <p className="text-[10px] text-zinc-400">已排期</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
