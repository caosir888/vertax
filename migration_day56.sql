-- ============================================================
-- Day 56 迁移：独立站联系表单
-- 在 Supabase SQL Editor 中执行
-- ============================================================

-- 1. 创建 site_inquiries 表
CREATE TABLE IF NOT EXISTS site_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  team_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 索引：按站点查询
CREATE INDEX IF NOT EXISTS idx_site_inquiries_site_id ON site_inquiries(site_id);
CREATE INDEX IF NOT EXISTS idx_site_inquiries_team_id ON site_inquiries(team_id);

-- 3. 不启用 RLS，应用层已通过 JWT + team_id 做权限控制
