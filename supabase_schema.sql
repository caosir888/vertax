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

-- ==================== 迁移（Day 25） ====================
-- 如果 tenants 表已存在，执行以下语句添加新字段：
-- alter table tenants add column if not exists company_name text;
-- alter table tenants add column if not exists industry text;
-- alter table tenants add column if not exists logo_url text;
