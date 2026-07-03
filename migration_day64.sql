-- ============================================================
-- Day 64-66 迁移：订阅计费 + 管理后台
-- 在 Supabase SQL Editor 中执行
-- ============================================================

-- 1. tenants 表新增订阅列
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

-- 2. 添加检查约束（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenants_plan_check') THEN
    ALTER TABLE tenants ADD CONSTRAINT tenants_plan_check CHECK (plan IN ('free', 'pro', 'enterprise'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenants_subscription_status_check') THEN
    ALTER TABLE tenants ADD CONSTRAINT tenants_subscription_status_check CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'expired'));
  END IF;
END $$;

-- 3. 订阅记录表
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  transaction_id TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_team_id ON subscriptions(team_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_all" ON subscriptions FOR ALL USING (true);

-- 4. users 表新增平台管理员标识
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN DEFAULT false;
