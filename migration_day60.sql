-- ============================================================
-- Day 60-61 迁移：协作功能（内容评论 + 任务分配 + 在线状态）
-- 在 Supabase SQL Editor 中执行
-- ============================================================

-- 1. 内容评论表
CREATE TABLE IF NOT EXISTS content_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  team_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_comments_content_id ON content_comments(content_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_team_id ON content_comments(team_id);

ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_comments_all" ON content_comments FOR ALL USING (true);

-- 2. 任务表
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_type TEXT DEFAULT NULL,
  target_id UUID DEFAULT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_team_id ON tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(team_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_target ON tasks(target_type, target_id);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_all" ON tasks FOR ALL USING (true);

-- 3. 用户在线状态表
CREATE TABLE IF NOT EXISTS user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL DEFAULT '',
  current_page TEXT DEFAULT '',
  last_seen_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_presence_team_id ON user_presence(team_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(team_id, last_seen_at);

ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_presence_all" ON user_presence FOR ALL USING (true);
