-- ============================================================
-- Day 99 迁移：AI 客户画像系统
-- 在 Supabase SQL Editor 中执行
-- ============================================================

-- 1. ICP 理想客户画像定义表
CREATE TABLE IF NOT EXISTS icp_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '默认画像',
  industries text[] DEFAULT '{}',
  company_size text DEFAULT '',
  roles text[] DEFAULT '{}',
  pain_points text[] DEFAULT '{}',
  budget_range text DEFAULT '',
  tech_stack text[] DEFAULT '{}',
  geo_regions text[] DEFAULT '{}',
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE icp_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "icp_definitions_all" ON icp_definitions FOR ALL USING (true);

-- 2. 客户画像表（AI 生成）
CREATE TABLE IF NOT EXISTS customer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  team_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  score int DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  company_summary text DEFAULT '',
  decision_maker_analysis text DEFAULT '',
  pain_point_match text DEFAULT '',
  recommended_approach text DEFAULT '',
  risk_factors text DEFAULT '',
  raw_analysis text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(lead_id)
);
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_profiles_all" ON customer_profiles FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_customer_profiles_score ON customer_profiles(team_id, score DESC);
