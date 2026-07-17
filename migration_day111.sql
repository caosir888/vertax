-- Day 111: 声量引擎 — 品牌声量与市场热度监控
-- buzz_monitors: 监控配置
-- buzz_mentions: 提及数据
-- buzz_alerts: 告警规则

-- 监控配置表
CREATE TABLE IF NOT EXISTS buzz_monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('brand', 'competitor', 'keyword')),
  keywords JSONB DEFAULT '[]',
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 提及数据表
CREATE TABLE IF NOT EXISTS buzz_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID NOT NULL REFERENCES buzz_monitors(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source TEXT DEFAULT '',
  url TEXT DEFAULT '',
  title TEXT NOT NULL,
  snippet TEXT DEFAULT '',
  sentiment TEXT DEFAULT '' CHECK (sentiment IN ('', 'positive', 'negative', 'neutral')),
  confidence REAL DEFAULT 0,
  mention_date DATE DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 告警规则表
CREATE TABLE IF NOT EXISTS buzz_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID NOT NULL REFERENCES buzz_monitors(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sentiment_drop', 'volume_spike')),
  threshold REAL NOT NULL DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_buzz_monitors_team ON buzz_monitors(team_id);
CREATE INDEX IF NOT EXISTS idx_buzz_mentions_team ON buzz_mentions(team_id);
CREATE INDEX IF NOT EXISTS idx_buzz_mentions_monitor ON buzz_mentions(monitor_id);
CREATE INDEX IF NOT EXISTS idx_buzz_mentions_sentiment ON buzz_mentions(sentiment);
CREATE INDEX IF NOT EXISTS idx_buzz_mentions_date ON buzz_mentions(mention_date);
CREATE INDEX IF NOT EXISTS idx_buzz_alerts_team ON buzz_alerts(team_id);
CREATE INDEX IF NOT EXISTS idx_buzz_alerts_monitor ON buzz_alerts(monitor_id);

-- RLS
ALTER TABLE buzz_monitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "buzz_monitors_all" ON buzz_monitors FOR ALL USING (true);

ALTER TABLE buzz_mentions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "buzz_mentions_all" ON buzz_mentions FOR ALL USING (true);

ALTER TABLE buzz_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "buzz_alerts_all" ON buzz_alerts FOR ALL USING (true);
