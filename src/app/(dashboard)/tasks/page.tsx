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

interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  assignee_id?: string;
  creator_id: string;
  target_type?: string;
  target_id?: string;
  created_at: string;
  updated_at: string;
}

interface Member {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  role: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "待处理", color: "bg-yellow-100 text-yellow-700" },
  in_progress: { label: "进行中", color: "bg-blue-100 text-blue-700" },
  done: { label: "已完成", color: "bg-green-100 text-green-700" },
};

const priorityLabels: Record<string, { label: string; icon: string; color: string }> = {
  high: { label: "高", icon: "🔴", color: "text-red-500" },
  medium: { label: "中", icon: "🟡", color: "text-yellow-500" },
  low: { label: "低", icon: "🟢", color: "text-green-500" },
};

const targetLabels: Record<string, string> = {
  content: "内容",
  lead: "线索",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: "", assignee_id: "" });

  // 新建/编辑
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignee_id: "",
    priority: "medium" as "low" | "medium" | "high",
    target_type: "",
    target_id: "",
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 删除
  const [delOpen, setDelOpen] = useState(false);
  const [delId, setDelId] = useState("");

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [filter]);

  async function loadMembers() {
    try {
      const res = await fetch("/api/team/members");
      const json = await res.json();
      if (json.data) setMembers(json.data);
    } catch {
      /* ignore */
    }
  }

  async function loadTasks() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.status) params.set("status", filter.status);
      if (filter.assignee_id) params.set("assignee_id", filter.assignee_id);
      const res = await fetch(`/api/tasks?${params}`);
      const json = await res.json();
      if (json.data) setTasks(json.data);
    } catch {
      toast.error("加载失败");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditId(null);
    setForm({ title: "", description: "", assignee_id: "", priority: "medium", target_type: "", target_id: "" });
    setFormOpen(true);
  }

  function openEdit(task: TaskItem) {
    setEditId(task.id);
    setForm({
      title: task.title,
      description: task.description || "",
      assignee_id: task.assignee_id || "",
      priority: task.priority,
      target_type: task.target_type || "",
      target_id: task.target_id || "",
    });
    setFormOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error("请输入任务标题");
      return;
    }
    setSaving(true);
    try {
      const url = editId ? `/api/tasks/${editId}` : "/api/tasks";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description,
          assignee_id: form.assignee_id || null,
          priority: form.priority,
          target_type: form.target_type || null,
          target_id: form.target_id || null,
        }),
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
        return;
      }
      toast.success(editId ? "已更新" : "已创建");
      setFormOpen(false);
      loadTasks();
    } catch {
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(taskId: string, status: string) {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
        return;
      }
      toast.success("状态已更新");
      loadTasks();
    } catch {
      toast.error("更新失败");
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/tasks/${delId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
        return;
      }
      toast.success("已删除");
      loadTasks();
    } catch {
      toast.error("删除失败");
    }
  }

  function getAssigneeName(assigneeId?: string) {
    if (!assigneeId) return null;
    const m = members.find((m) => m.user_id === assigneeId);
    return m?.user_name || "未知";
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-black">任务管理</h1>
          <p className="text-sm text-zinc-400 mt-0.5">分配和跟踪团队任务</p>
        </div>
        <Button onClick={openCreate} className="rounded-xl bg-black text-white hover:bg-zinc-800 text-sm">
          + 新建任务
        </Button>
      </div>

      {/* 筛选栏 */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={filter.status}
          onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-black"
        >
          <option value="">全部状态</option>
          <option value="pending">待处理</option>
          <option value="in_progress">进行中</option>
          <option value="done">已完成</option>
        </select>
        <select
          value={filter.assignee_id}
          onChange={(e) => setFilter((f) => ({ ...f, assignee_id: e.target.value }))}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-black"
        >
          <option value="">全部成员</option>
          {members.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.user_name}
            </option>
          ))}
        </select>
        {(filter.status || filter.assignee_id) && (
          <button
            onClick={() => setFilter({ status: "", assignee_id: "" })}
            className="text-xs text-zinc-400 hover:text-zinc-600"
          >
            清除筛选
          </button>
        )}
      </div>

      {/* 任务列表 */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-zinc-100 animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-2xl mb-2">📋</p>
          <p className="text-sm text-zinc-400">
            {filter.status || filter.assignee_id ? "没有匹配的任务" : "暂无任务，点击上方按钮创建一个"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const assigneeName = getAssigneeName(task.assignee_id);
            const statusInfo = statusLabels[task.status];
            const priorityInfo = priorityLabels[task.priority];
            return (
              <div
                key={task.id}
                className={`rounded-xl border bg-white p-4 transition-all ${
                  task.status === "done" ? "border-zinc-100 opacity-60" : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* 优先级 */}
                  <span className="mt-0.5 text-sm" title={`优先级：${priorityInfo.label}`}>
                    {priorityInfo.icon}
                  </span>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`text-sm font-medium ${task.status === "done" ? "text-zinc-400 line-through" : "text-black"}`}>
                        {task.title}
                      </h3>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      {task.target_type && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500">
                          {targetLabels[task.target_type] || task.target_type}
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {assigneeName && (
                        <span className="flex items-center gap-1 text-xs text-zinc-500">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black text-[8px] text-white font-medium">
                            {assigneeName.charAt(0)}
                          </span>
                          {assigneeName}
                        </span>
                      )}
                      <span className="text-xs text-zinc-300">
                        {new Date(task.created_at).toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                  </div>

                  {/* 操作 */}
                  <div className="flex items-center gap-1 shrink-0">
                    {task.status === "pending" && (
                      <button
                        onClick={() => updateStatus(task.id, "in_progress")}
                        className="text-xs text-blue-500 hover:text-blue-700 px-1"
                      >
                        开始
                      </button>
                    )}
                    {task.status === "in_progress" && (
                      <button
                        onClick={() => updateStatus(task.id, "done")}
                        className="text-xs text-green-500 hover:text-green-700 px-1"
                      >
                        完成
                      </button>
                    )}
                    {task.status === "done" && (
                      <button
                        onClick={() => updateStatus(task.id, "pending")}
                        className="text-xs text-zinc-400 hover:text-zinc-600 px-1"
                      >
                        重开
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(task)}
                      className="text-xs text-indigo-500 hover:text-indigo-700 px-1"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => { setDelId(task.id); setDelOpen(true); }}
                      className="text-xs text-zinc-400 hover:text-red-500 px-1"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 新建/编辑弹窗 */}
      <Dialog open={formOpen} onOpenChange={(open) => { if (!open) setFormOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "编辑任务" : "新建任务"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">任务标题 *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="输入任务标题"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">描述</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="任务描述（可选）"
                rows={3}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-black resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">指派人</label>
                <select
                  value={form.assignee_id}
                  onChange={(e) => setForm((f) => ({ ...f, assignee_id: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-black"
                >
                  <option value="">未指派</option>
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.user_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">优先级</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as "low" | "medium" | "high" }))}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-black"
                >
                  <option value="low">🟢 低</option>
                  <option value="medium">🟡 中</option>
                  <option value="high">🔴 高</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} className="rounded-xl text-sm">
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving} className="rounded-xl bg-black text-white hover:bg-zinc-800 text-sm">
              {saving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <ConfirmDialog
        open={delOpen}
        onOpenChange={setDelOpen}
        title="删除任务"
        description="确定删除该任务？此操作不可撤销。"
        confirmLabel="删除"
        onConfirm={handleDelete}
      />
    </div>
  );
}
