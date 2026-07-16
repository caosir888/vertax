-- Day 104: Phase 2 — 采购机会模块 + 外联工作台
-- 线索表：添加下次联系日期
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_contact_date DATE;

-- 商机表（采购机会 Pipeline）
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  company TEXT DEFAULT '',
  contact_name TEXT DEFAULT '',
  stage TEXT DEFAULT 'initial_contact' CHECK (stage IN (
    'initial_contact', 'needs_confirmation', 'proposal_quote', 'negotiation', 'won', 'lost'
  )),
  deal_value DECIMAL(12,2) DEFAULT 0,
  probability INTEGER DEFAULT 10 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  products_interested TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "opportunities_all" ON opportunities FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_opportunities_team_stage ON opportunities(team_id, stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_lead ON opportunities(lead_id);
