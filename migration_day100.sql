-- ============================================================
-- Day 100 迁移：邮件自动化系统
-- 在 Supabase SQL Editor 中执行
-- ============================================================

-- 1. 邮件营销活动表
CREATE TABLE IF NOT EXISTS email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '未命名活动',
  subject text NOT NULL DEFAULT '',
  template text NOT NULL DEFAULT '',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'paused')),
  lead_count int DEFAULT 0,
  sent_count int DEFAULT 0,
  open_count int DEFAULT 0,
  click_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_campaigns_all" ON email_campaigns FOR ALL USING (true);

-- 2. 邮件序列步骤表
CREATE TABLE IF NOT EXISTS email_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES email_campaigns(id) ON DELETE CASCADE,
  team_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  step_order int NOT NULL DEFAULT 1,
  subject text NOT NULL DEFAULT '',
  template text NOT NULL DEFAULT '',
  delay_hours int DEFAULT 24,
  trigger_condition text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_sequences_all" ON email_sequences FOR ALL USING (true);

-- 3. 邮件发送记录 + 追踪表
CREATE TABLE IF NOT EXISTS email_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES email_campaigns(id) ON DELETE CASCADE,
  team_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  lead_email text NOT NULL,
  subject text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'clicked', 'bounced', 'unsubscribed')),
  opened_at timestamptz,
  clicked_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_sends_all" ON email_sends FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_email_sends_campaign ON email_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_lead ON email_sends(lead_id);

-- 4. 退订表
CREATE TABLE IF NOT EXISTS email_unsubscribes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  reason text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, email)
);
ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_unsubscribes_all" ON email_unsubscribes FOR ALL USING (true);
