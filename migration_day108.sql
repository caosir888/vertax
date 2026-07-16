-- Day 108: 内容编辑器架构优化
-- 在 Supabase SQL Editor 中执行

ALTER TABLE contents ADD COLUMN IF NOT EXISTS slug TEXT DEFAULT '';
ALTER TABLE contents ADD COLUMN IF NOT EXISTS seo_title TEXT DEFAULT '';
ALTER TABLE contents ADD COLUMN IF NOT EXISTS seo_description TEXT DEFAULT '';
ALTER TABLE contents ADD COLUMN IF NOT EXISTS outline JSONB DEFAULT '[]';
ALTER TABLE contents ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '';
ALTER TABLE contents ADD COLUMN IF NOT EXISTS publish_date TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_contents_slug ON contents(team_id, slug);
