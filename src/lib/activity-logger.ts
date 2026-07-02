import { getSupabase } from "@/lib/supabase";

// 记录操作日志（不阻塞主流程，异步 fire-and-forget）
export function logActivity(params: {
  team_id: string;
  user_id: string;
  user_name: string;
  action: string;
  target: string;
  details?: string;
}) {
  getSupabase()
    .from("activity_logs")
    .insert({
      team_id: params.team_id,
      user_id: params.user_id,
      user_name: params.user_name,
      action: params.action,
      target: params.target,
      details: params.details || "",
    })
    .then(({ error }) => {
      if (error) console.error("[activity_logger]", error.message);
    });
}
