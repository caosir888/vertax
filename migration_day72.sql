-- ============================================================
-- Day 72 迁移：Webhook 系统
-- 在 Supabase SQL Editor 中执行
-- ============================================================

-- 1. Webhook 配置表
CREATE TABLE IF NOT EXISTS webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  events jsonb NOT NULL DEFAULT '[]',
  secret text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhooks_all" ON webhooks FOR ALL USING (true);

-- 2. Webhook 发送日志表
CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid REFERENCES webhooks(id) ON DELETE CASCADE,
  event text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  response_code int DEFAULT 0,
  response_body text DEFAULT '',
  duration_ms int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhook_logs_all" ON webhook_logs FOR ALL USING (true);
