import { getSupabase } from "@/lib/supabase";
import crypto from "crypto";

export type WebhookEvent =
  | "lead.created"
  | "lead.updated"
  | "content.published"
  | "team.member_added";

function signPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

interface WebhookRecord {
  id: string;
  team_id: string;
  url: string;
  secret: string;
  events: string[];
}

export async function fireWebhook(teamId: string, event: WebhookEvent, data: Record<string, unknown>) {
  const { data: webhooks, error } = await getSupabase()
    .from("webhooks")
    .select("id, team_id, url, secret, events")
    .eq("team_id", teamId)
    .eq("is_active", true);

  if (error || !webhooks?.length) return;

  const payload = JSON.stringify({ event, data, timestamp: new Date().toISOString() });

  for (const wh of webhooks as WebhookRecord[]) {
    const events = wh.events || [];
    if (!events.includes(event)) continue;

    const signature = signPayload(payload, wh.secret);
    const start = Date.now();

    try {
      const res = await fetch(wh.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Vertax-Webhook-Event": event,
          "X-Vertax-Webhook-Signature": signature,
        },
        body: payload,
      });

      await getSupabase()
        .from("webhook_logs")
        .insert({
          webhook_id: wh.id,
          event,
          status: res.ok ? "success" : "failed",
          response_code: res.status,
          response_body: await res.text().catch(() => ""),
          duration_ms: Date.now() - start,
        });
    } catch (err: unknown) {
      await getSupabase()
        .from("webhook_logs")
        .insert({
          webhook_id: wh.id,
          event,
          status: "error",
          response_code: 0,
          response_body: err instanceof Error ? err.message : "Unknown error",
          duration_ms: Date.now() - start,
        });
    }
  }
}

// fire-and-forget 版本，不阻塞业务响应
export function fireWebhookAsync(teamId: string, event: WebhookEvent, data: Record<string, unknown>) {
  fireWebhook(teamId, event, data).catch((err) => {
    console.error("Webhook 发送失败:", err);
  });
}
