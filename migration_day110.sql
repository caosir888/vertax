-- Day 110: GEO 发布 — 结构化数据注入 + 公开内容页
ALTER TABLE contents ADD COLUMN IF NOT EXISTS geo_data JSONB DEFAULT '{}';
