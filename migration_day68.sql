-- ============================================================
-- Day 67-68 迁移：运营后台细化（租户启用/停用 + 用户管理）
-- 在 Supabase SQL Editor 中执行
-- ============================================================

-- 1. tenants 表新增启用/停用
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. users 表新增禁用标识
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN DEFAULT false;
