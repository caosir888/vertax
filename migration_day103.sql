-- Day 103: 获客雷达 — 搜索任务追踪
CREATE TABLE IF NOT EXISTS radar_search_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  icp_id UUID REFERENCES icp_definitions(id),
  status TEXT DEFAULT 'pending',
  leads_found INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE radar_search_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "radar_search_jobs_team" ON radar_search_jobs
  FOR ALL USING (team_id = (SELECT team_id FROM users WHERE id = auth.uid()));
