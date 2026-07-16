-- Day 105b: SEO/AEO 审计表
CREATE TABLE IF NOT EXISTS seo_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
  team_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  seo_score INTEGER DEFAULT 0,
  aeo_score INTEGER DEFAULT 0,
  title_score INTEGER DEFAULT 0,
  meta_description_score INTEGER DEFAULT 0,
  content_structure_score INTEGER DEFAULT 0,
  keyword_usage_score INTEGER DEFAULT 0,
  readability_score INTEGER DEFAULT 0,
  internal_links_score INTEGER DEFAULT 0,
  has_schema BOOLEAN DEFAULT false,
  has_geo BOOLEAN DEFAULT false,
  has_faq BOOLEAN DEFAULT false,
  issues JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE seo_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seo_audits_all" ON seo_audits FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_seo_audits_content ON seo_audits(content_id);
CREATE INDEX IF NOT EXISTS idx_seo_audits_team ON seo_audits(team_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_seo_audits_content_unique ON seo_audits(content_id);
