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

-- 6. 开启 pgvector 扩展 + 加 embedding 列（Day 31 — 向量化）
create extension if not exists vector;
alter table document_chunks add column if not exists embedding vector(1024);

-- 7. 知识库表（Day 33 — 多知识库管理）
create table if not exists knowledge_bases (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references tenants(id) on delete cascade,
  name text not null,
  description text default '',
  created_at timestamptz default now()
);
alter table knowledge_bases enable row level security;
create policy "knowledge_bases_all" on knowledge_bases for all using (true);

-- 8. documents 加 knowledge_base_id
alter table documents add column if not exists knowledge_base_id uuid references knowledge_bases(id) on delete set null;

-- 9. 聊天会话表（Day 33 — 问答历史）
create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references tenants(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  knowledge_base_id uuid references knowledge_bases(id) on delete set null,
  title text not null default '新对话',
  created_at timestamptz default now()
);
alter table chat_sessions enable row level security;
create policy "chat_sessions_all" on chat_sessions for all using (true);

-- 10. 聊天消息表
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  sources jsonb default '[]',
  created_at timestamptz default now()
);
alter table chat_messages enable row level security;
create policy "chat_messages_all" on chat_messages for all using (true);

-- 11. pgvector 语义搜索函数（RPC）
create or replace function search_chunks(
  query_embedding vector(1024),
  match_threshold float default 0.5,
  match_count int default 5,
  filter_team_id uuid default null,
  filter_knowledge_base_id uuid default null
) returns table(
  id uuid,
  content text,
  chunk_index int,
  document_id uuid,
  similarity float
) language plpgsql as $$
begin
  return query
  select
    dc.id,
    dc.content,
    dc.chunk_index,
    dc.document_id,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  join documents d on d.id = dc.document_id
  where dc.embedding is not null
    and (filter_team_id is null or d.team_id = filter_team_id)
    and (filter_knowledge_base_id is null or d.knowledge_base_id = filter_knowledge_base_id)
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 12. pgvector 索引（加速搜索）
create index if not exists document_chunks_embedding_idx
  on document_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 13. 内容库表（Day 38 — 内容管理）
create table if not exists contents (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references tenants(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  template_id text default '',
  title text not null default '未命名',
  content text not null default '',
  language text default 'zh-CN',
  status text default 'draft' check (status in ('draft', 'review', 'published')),
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table contents enable row level security;
create policy "contents_all" on contents for all using (true);

-- 14. 内容版本表
create table if not exists content_versions (
  id uuid primary key default gen_random_uuid(),
  content_id uuid references contents(id) on delete cascade,
  version_number int not null,
  content text not null,
  created_at timestamptz default now()
);
alter table content_versions enable row level security;
create policy "content_versions_all" on content_versions for all using (true);
