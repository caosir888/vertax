-- 用户自定义模板表
CREATE TABLE IF NOT EXISTS user_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'custom',
  variables JSONB DEFAULT '[]',
  system_prompt TEXT DEFAULT '',
  user_prompt TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_templates_team ON user_templates(team_id);
CREATE INDEX IF NOT EXISTS idx_user_templates_user ON user_templates(user_id);
