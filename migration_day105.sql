-- Day 105: 增长系统 — 主题集群 + 内容支柱 + 内容简报
-- 在 Supabase SQL Editor 中执行

-- 1. 主题集群表
CREATE TABLE IF NOT EXISTS topic_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company_name TEXT DEFAULT '',
  company_context TEXT DEFAULT '',
  buyer_context TEXT DEFAULT '',
  problem_map JSONB DEFAULT '[]',
  distribution_channels JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE topic_clusters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "topic_clusters_all" ON topic_clusters FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_topic_clusters_team ON topic_clusters(team_id);

-- 2. 内容支柱表
CREATE TABLE IF NOT EXISTS content_pillars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID REFERENCES topic_clusters(id) ON DELETE CASCADE,
  team_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  intent_type TEXT DEFAULT 'informational',
  description TEXT DEFAULT '',
  questions JSONB DEFAULT '[]',
  priority_personas JSONB DEFAULT '[]',
  primary_channels JSONB DEFAULT '[]',
  secondary_channels JSONB DEFAULT '[]',
  evidence_required INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE content_pillars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_pillars_all" ON content_pillars FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_content_pillars_cluster ON content_pillars(cluster_id);

-- 3. 内容简报表
CREATE TABLE IF NOT EXISTS content_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pillar_id UUID REFERENCES content_pillars(id) ON DELETE CASCADE,
  team_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  content_type TEXT DEFAULT '',
  funnel_stage TEXT DEFAULT 'TOFU',
  intent TEXT DEFAULT 'informational',
  target_persona TEXT DEFAULT '',
  priority_question TEXT DEFAULT '',
  evidence_count INTEGER DEFAULT 0,
  primary_channel TEXT DEFAULT '',
  secondary_channel TEXT DEFAULT '',
  evidence_refs JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft',
  generated_content TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE content_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_briefs_all" ON content_briefs FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_content_briefs_pillar ON content_briefs(pillar_id);

-- 4. 证据库表
CREATE TABLE IF NOT EXISTS evidence_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pillar_id UUID REFERENCES content_pillars(id) ON DELETE CASCADE,
  team_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  source TEXT DEFAULT '',
  source_type TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE evidence_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evidence_items_all" ON evidence_items FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_evidence_items_pillar ON evidence_items(pillar_id);
