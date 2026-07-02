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

-- 3. RLS：公开插入（访客提交） + 团队成员查看
ALTER TABLE site_inquiries ENABLE ROW LEVEL SECURITY;

-- 允许任何人插入（访客提交表单）
DROP POLICY IF EXISTS site_inquiries_insert ON site_inquiries;
CREATE POLICY site_inquiries_insert ON site_inquiries
  FOR INSERT
  WITH CHECK (true);

-- 允许团队成员查看自己团队的询盘
DROP POLICY IF EXISTS site_inquiries_select ON site_inquiries;
CREATE POLICY site_inquiries_select ON site_inquiries
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM team_members WHERE team_id = site_inquiries.team_id
    )
  );

-- 允许团队成员删除自己团队的询盘
DROP POLICY IF EXISTS site_inquiries_delete ON site_inquiries;
CREATE POLICY site_inquiries_delete ON site_inquiries
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM team_members WHERE team_id = site_inquiries.team_id
    )
  );
