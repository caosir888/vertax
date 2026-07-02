import type { Role } from "@/types";

// 权限矩阵：哪些角色可以执行哪些操作
export type Action = "create" | "read" | "update" | "delete";

const ROLE_PERMISSIONS: Record<Role, Action[]> = {
  owner: ["create", "read", "update", "delete"],
  admin: ["create", "read", "update", "delete"],
  editor: ["create", "read", "update"],
  viewer: ["read"],
};

// 检查角色是否有某个操作权限
export function canDo(role: Role, action: Action): boolean {
  return ROLE_PERMISSIONS[role]?.includes(action) ?? false;
}

// 检查是否为管理员及以上
export function isAdmin(role: Role): boolean {
  return role === "owner" || role === "admin";
}

// 角色中文名
export const roleLabels: Record<Role, string> = {
  owner: "拥有者",
  admin: "管理员",
  editor: "编辑者",
  viewer: "只读",
};

// 角色颜色
export const roleColors: Record<Role, string> = {
  owner: "bg-black text-white",
  admin: "bg-indigo-100 text-indigo-700",
  editor: "bg-zinc-100 text-zinc-600",
  viewer: "bg-zinc-50 text-zinc-400",
};

// 获取用户在当前团队的角色
export async function getUserRole(userId: string, teamId: string): Promise<Role | null> {
  // 用动态 import 避免循环依赖
  const { getSupabase } = await import("@/lib/supabase");
  const { data } = await getSupabase()
    .from("team_members")
    .select("role")
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .maybeSingle();
  return (data?.role as Role) || null;
}
