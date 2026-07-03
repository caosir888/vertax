import { getSupabase } from "@/lib/supabase";

interface ApiKeyResult {
  valid: boolean;
  team_id?: string;
  error?: string;
}

export async function validateApiKey(apiKey: string): Promise<ApiKeyResult> {
  if (!apiKey || !apiKey.startsWith("vx_")) {
    return { valid: false, error: "无效的 API Key 格式" };
  }

  const { data, error } = await getSupabase()
    .from("api_keys")
    .select("team_id, key")
    .eq("key", apiKey)
    .single();

  if (error || !data) {
    return { valid: false, error: "API Key 不存在或已失效" };
  }

  // 更新最后使用时间（fire-and-forget）
  (async () => {
    try {
      await getSupabase()
        .from("api_keys")
        .update({ last_used_at: new Date().toISOString() })
        .eq("key", apiKey);
    } catch { /* 忽略更新失败 */ }
  })();

  return { valid: true, team_id: data.team_id };
}

// 从 Authorization header 中提取 API Key
export function extractApiKey(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (!auth) return null;

  // Bearer vx_xxx
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") return null;
  return parts[1];
}
