-- VertaX 数据库初始化
-- 在 Supabase SQL Editor 中粘贴并运行

-- 1. 用户表
create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password text not null,
  created_at timestamptz default now()
);
alter table users enable row level security;
create policy "users_all" on users for all using (true);

-- 2. 团队/租户表
create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_name text,
  industry text,
  logo_url text,
  created_at timestamptz default now()
);
alter table tenants enable row level security;
create policy "tenants_all" on tenants for all using (true);

-- 3. 团队成员表
create table team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references tenants(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz default now(),
  unique(team_id, user_id)
);
alter table team_members enable row level security;
create policy "team_members_all" on team_members for all using (true);

-- 4. 备忘录表
create table memos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  team_id uuid references tenants(id) on delete cascade,
  title text not null,
  content text default '',
  created_at timestamptz default now()
);
alter table memos enable row level security;
create policy "memos_all" on memos for all using (true);

-- 5. API Key 表
create table api_keys (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references tenants(id) on delete cascade,
  name text not null,
  key text unique not null,
  created_at timestamptz default now(),
  last_used_at timestamptz
);
alter table api_keys enable row level security;
create policy "api_keys_all" on api_keys for all using (true);

-- 6. 通知表
create table notifications (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references tenants(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  title text not null,
  message text default '',
  is_read boolean default false,
  created_at timestamptz default now()
);
alter table notifications enable row level security;
create policy "notifications_all" on notifications for all using (true);

-- 7. 知识库文档表
create table documents (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references tenants(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  name text not null,
  file_url text not null,
  file_size integer default 0,
  file_type text default '',
  status text default 'ready',
  created_at timestamptz default now()
);
alter table documents enable row level security;
create policy "documents_all" on documents for all using (true);

-- 8. 文档分块表
create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  created_at timestamptz default now()
);
alter table document_chunks enable row level security;
create policy "document_chunks_all" on document_chunks for all using (true);

-- 9. 知识库表（Day 33 — 多知识库管理）
create table knowledge_bases (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references tenants(id) on delete cascade,
  name text not null,
  description text default '',
  created_at timestamptz default now()
);
alter table knowledge_bases enable row level security;
create policy "knowledge_bases_all" on knowledge_bases for all using (true);

-- 10. documents 加 knowledge_base_id
alter table documents add column if not exists knowledge_base_id uuid references knowledge_bases(id) on delete set null;

-- 11. 聊天会话表（Day 33 — 问答历史）
create table chat_sessions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references tenants(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  knowledge_base_id uuid references knowledge_bases(id) on delete set null,
  title text not null default '新对话',
  created_at timestamptz default now()
);
alter table chat_sessions enable row level security;
create policy "chat_sessions_all" on chat_sessions for all using (true);

-- 12. 聊天消息表
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  sources jsonb default '[]',
  created_at timestamptz default now()
);
alter table chat_messages enable row level security;
create policy "chat_messages_all" on chat_messages for all using (true);

-- 13. 开启 pgvector 扩展（向量搜索）
create extension if not exists vector;

-- 14. 给 document_chunks 加 embedding 列（1536 维 = OpenAI text-embedding-3-small）
alter table document_chunks add column if not exists embedding vector(1536);

-- ==================== 迁移（Day 25） ====================
-- 如果 tenants 表已存在，执行以下语句添加新字段：
-- alter table tenants add column if not exists company_name text;
-- alter table tenants add column if not exists industry text;
-- alter table tenants add column if not exists logo_url text;
