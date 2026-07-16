-- Day 106: 发布策略 + GEO 发布中心
-- 在 Supabase SQL Editor 中执行

-- 1. 发布排期表
CREATE TABLE IF NOT EXISTS publish_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  brief_id UUID REFERENCES content_briefs(id) ON DELETE SET NULL,
  content_id UUID REFERENCES contents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  channel TEXT DEFAULT '',
  scheduled_date DATE,
  published_at TIMESTAMPTZ,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'published', 'cancelled')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE publish_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "publish_schedules_all" ON publish_schedules FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_publish_schedules_team ON publish_schedules(team_id);
CREATE INDEX IF NOT EXISTS idx_publish_schedules_date ON publish_schedules(scheduled_date);

-- 2. GEO 多语言版本表
CREATE TABLE IF NOT EXISTS geo_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
  brief_id UUID REFERENCES content_briefs(id) ON DELETE SET NULL,
  language TEXT NOT NULL DEFAULT 'en',
  region TEXT DEFAULT '',
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'translated', 'published')),
  source TEXT DEFAULT 'ai',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE geo_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "geo_versions_all" ON geo_versions FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_geo_versions_team ON geo_versions(team_id);
CREATE INDEX IF NOT EXISTS idx_geo_versions_content ON geo_versions(content_id);

-- 3. 给 contents 表补充字段（如果还没有）
ALTER TABLE contents ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'zh-CN';
ALTER TABLE contents ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
