-- ============================================================
-- Day 80 迁移：独立站分析 + SEO 增强
-- 在 Supabase SQL Editor 中执行
-- ============================================================

-- 站点访问统计表
CREATE TABLE IF NOT EXISTS site_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE,
  page text NOT NULL DEFAULT 'home',
  user_agent text DEFAULT '',
  referer text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE site_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_analytics_all" ON site_analytics FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_site_analytics_site_id ON site_analytics(site_id);
