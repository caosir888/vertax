-- Day 112: 声量引擎 — 社交媒体管理增强
-- buzz_mentions 加 status/platforms/account_id/interactions 字段
-- buzz_accounts: 已授权社交账号

-- 内容发布状态 & 平台
ALTER TABLE buzz_mentions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'failed'));
ALTER TABLE buzz_mentions ADD COLUMN IF NOT EXISTS platforms TEXT[] DEFAULT '{}';
ALTER TABLE buzz_mentions ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES buzz_accounts(id) ON DELETE SET NULL;
ALTER TABLE buzz_mentions ADD COLUMN IF NOT EXISTS interactions INTEGER DEFAULT 0;

-- 已授权社交账号表
CREATE TABLE IF NOT EXISTS buzz_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'twitter', 'linkedin', 'youtube', 'tiktok')),
  account_name TEXT NOT NULL,
  account_handle TEXT DEFAULT '',
  access_token TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'disconnected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_buzz_accounts_team ON buzz_accounts(team_id);
CREATE INDEX IF NOT EXISTS idx_buzz_mentions_status ON buzz_mentions(status);
CREATE INDEX IF NOT EXISTS idx_buzz_mentions_account ON buzz_mentions(account_id);

ALTER TABLE buzz_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "buzz_accounts_all" ON buzz_accounts FOR ALL USING (true);
