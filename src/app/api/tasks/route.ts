import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { sendNotification } from "@/lib/notifications";

// GET /api/tasks — 获取任务列表（支持筛选）
export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const status = params.get("status");
  const assignee_id = params.get("assignee_id");
  const target_type = params.get("target_type");
  const target_id = params.get("target_id");

  let query = getSupabase()
    .from("tasks")
    .select("*")
    .eq("team_id", user.team_id);

  if (status) query = query.eq("status", status);
  if (assignee_id) query = query.eq("assignee_id", assignee_id);
  if (target_type) query = query.eq("target_type", target_type);
  if (target_id) query = query.eq("target_id", target_id);

  const { data, error } = await query.order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/tasks — 创建任务
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    description = "",
    assignee_id = null,
    target_type = null,
    target_id = null,
    priority = "medium",
  } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "任务标题不能为空" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("tasks")
    .insert({
      team_id: user.team_id,
      creator_id: user.id,
      assignee_id,
      target_type,
      target_id,
      title: title.trim(),
      description,
      status: "pending",
      priority,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logActivity({
    team_id: user.team_id!,
    user_id: user.id,
    user_name: user.name,
    action: "创建任务",
    target: data.title,
  });

  sendNotification({
    team_id: user.team_id!,
    actor_id: user.id,
    title: `新任务「${data.title}」已创建`,
    message: `优先级：${priority === "high" ? "高" : priority === "medium" ? "中" : "低"}`,
  });

  return NextResponse.json({ data }, { status: 201 });
}
