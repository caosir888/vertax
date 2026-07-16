-- Day 109: GEO 发布中心重构 — AI 引文优化 + 引擎分发追踪
-- 在 Supabase SQL Editor 中执行

-- 给 geo_versions 补充 GEO 优化字段
ALTER TABLE geo_versions ADD COLUMN IF NOT EXISTS geo_summary TEXT DEFAULT '';
ALTER TABLE geo_versions ADD COLUMN IF NOT EXISTS framework TEXT DEFAULT '';
ALTER TABLE geo_versions ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0;
ALTER TABLE geo_versions ADD COLUMN IF NOT EXISTS source_content_id UUID REFERENCES contents(id) ON DELETE SET NULL;
ALTER TABLE geo_versions ADD COLUMN IF NOT EXISTS engine_tracking JSONB DEFAULT '[]';
ALTER TABLE geo_versions ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'generated';
ALTER TABLE geo_versions ADD COLUMN IF NOT EXISTS geo_title TEXT DEFAULT '';
