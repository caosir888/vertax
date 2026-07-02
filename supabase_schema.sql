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
