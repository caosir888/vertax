-- 为 content_analytics 表添加 clicks 字段
ALTER TABLE content_analytics ADD COLUMN IF NOT EXISTS clicks INT DEFAULT 0;
