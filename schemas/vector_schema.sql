create extension if not exists vector;

create table if not exists rag_documents (
  document_id uuid primary key default gen_random_uuid(),
  title text not null,
  document_type text not null,
  source text not null,
  project_name text,
  location text,
  version integer not null default 1,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists rag_chunks (
  chunk_id uuid primary key default gen_random_uuid(),
  document_id uuid not null references rag_documents(document_id) on delete cascade,
  chunk_index integer not null,
  chunk_text text not null,
  embedding vector(1536),
  metadata jsonb not null default '{}'::jsonb,
  source text not null,
  project_name text,
  location text,
  intent_tags text[] not null default '{}',
  pii_free boolean not null default true,
  created_at timestamptz not null default now(),
  unique(document_id, chunk_index)
);

create index if not exists rag_chunks_embedding_idx on rag_chunks using ivfflat (embedding vector_cosine_ops);
create index if not exists rag_chunks_project_idx on rag_chunks(project_name);
create index if not exists rag_chunks_location_idx on rag_chunks(location);
create index if not exists rag_chunks_intent_tags_idx on rag_chunks using gin(intent_tags);
