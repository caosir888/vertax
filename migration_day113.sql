-- Day 113: 知识库升级 — 网站智采 + 字段扩展
ALTER TABLE documents ADD COLUMN IF NOT EXISTS source_url TEXT DEFAULT '';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS content_text TEXT DEFAULT '';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS chunk_count INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS original_filename TEXT DEFAULT '';
