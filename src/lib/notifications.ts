import { getSupabase } from "@/lib/supabase";

// 向团队成员发送通知（fire-and-forget，不阻塞响应）
export function sendNotification(params: {
  team_id: string;
  actor_id: string;
  title: string;
  message?: string;
}) {
  const { team_id, actor_id, title, message = "" } = params;

  // 异步执行：先查出团队成员，再批量插入通知
  (async () => {
    try {
      const { data: members, error } = await getSupabase()
        .from("team_members")
        .select("user_id")
        .eq("team_id", team_id);

      if (error || !members?.length) return;

      const notifications = members
        .filter((m) => m.user_id !== actor_id)
        .map((m) => ({
          team_id,
          user_id: m.user_id,
          title,
          message,
        }));

      if (notifications.length === 0) return;

      const { error: insertError } = await getSupabase()
        .from("notifications")
        .insert(notifications);

      if (insertError) {
        console.error("通知发送失败:", insertError.message);
      }
    } catch (err) {
      console.error("通知查询失败:", err);
    }
  })();
}
