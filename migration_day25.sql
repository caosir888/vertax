-- Day 25-26 数据库迁移：在 Supabase SQL Editor 中执行
-- 1. 给 tenants 表添加新字段（如果不存在）
alter table tenants add column if not exists company_name text;
alter table tenants add column if not exists industry text;
alter table tenants add column if not exists logo_url text;

-- 2. 创建 api_keys 表（如果不存在）
create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references tenants(id) on delete cascade,
  name text not null,
  key text unique not null,
  created_at timestamptz default now(),
  last_used_at timestamptz
);
alter table api_keys enable row level security;
create policy "api_keys_all" on api_keys for all using (true);

-- 3. 创建 notifications 表（Day 26）
create table if not exists notifications (
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
