import { getSupabase } from "@/lib/supabase";
import type { Role } from "@/types";

// 检查当前用户是否有权限操作团队（owner / admin）
export async function checkTeamPermission(
  userId: string,
  teamId: string | undefined,
  allowedRoles: Role[] = ["owner", "admin"]
): Promise<{ allowed: boolean; error?: string }> {
  if (!teamId) {
    return { allowed: false, error: "未关联团队" };
  }

  const { data: membership } = await getSupabase()
    .from("team_members")
    .select("role")
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!membership) {
    return { allowed: false, error: "你不是该团队成员" };
  }

  const role = membership.role as Role;
  if (!allowedRoles.includes(role)) {
    return { allowed: false, error: "你没有权限执行此操作" };
  }

  return { allowed: true };
}
