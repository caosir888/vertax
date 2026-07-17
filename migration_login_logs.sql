-- 登录日志表，记录每次登录尝试（成功和失败）
CREATE TABLE IF NOT EXISTS login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  team_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  error_reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 索引：按用户查询
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
-- 索引：按团队查询
CREATE INDEX IF NOT EXISTS idx_login_logs_team_id ON login_logs(team_id);
-- 索引：按时间倒序
CREATE INDEX IF NOT EXISTS idx_login_logs_created_at ON login_logs(created_at DESC);
-- 索引：按邮箱查询
CREATE INDEX IF NOT EXISTS idx_login_logs_email ON login_logs(email);
