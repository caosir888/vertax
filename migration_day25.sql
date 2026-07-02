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

-- 4. 创建 documents 表（Day 29 — 知识库文档）
create table if not exists documents (
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

-- ==================== Supabase Storage 配置 ====================
-- 在 Supabase 后台 → Storage → 新建 Bucket：
--   Bucket name: documents
--   Public bucket: 勾选（公开访问）
--   RLS policy: 允许 authenticated 用户上传
-- 具体 SQL（在 Supabase SQL Editor 运行）：
--
-- insert into storage.buckets (id, name, public) values ('documents', 'documents', true);
-- create policy "Anyone can read documents"
--   on storage.objects for select using (bucket_id = 'documents');
-- create policy "Authenticated can upload documents"
--   on storage.objects for insert with check (bucket_id = 'documents' and auth.role() = 'authenticated');
-- create policy "Owner can delete documents"
--   on storage.objects for delete using (bucket_id = 'documents' and auth.role() = 'authenticated');

-- 5. 创建 document_chunks 表（Day 30 — 文档分块）
create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  created_at timestamptz default now()
);
alter table document_chunks enable row level security;
create policy "document_chunks_all" on document_chunks for all using (true);
