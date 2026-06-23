create extension if not exists "pgcrypto";
create extension if not exists vector;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  preferred_contact_method text check (preferred_contact_method in ('phone', 'email', 'whatsapp')),
  profile jsonb not null default '{}'::jsonb,
  lead_score integer not null default 0 check (lead_score >= 0 and lead_score <= 100),
  lead_category text not null default 'Cold' check (lead_category in ('Cold', 'Warm', 'Hot')),
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'viewing', 'reserved', 'converted', 'closed')),
  consent_given boolean not null default false,
  source_channel text,
  assigned_role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  session_id text not null unique,
  profile jsonb not null default '{}'::jsonb,
  messages jsonb not null default '[]'::jsonb,
  turn_count integer not null default 0,
  last_intent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.intent_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  intent text,
  confidence numeric(4,3) not null check (confidence >= 0 and confidence <= 1),
  evidence jsonb not null default '[]'::jsonb,
  profile_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.recommendation_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  project_name text not null,
  match_score integer not null check (match_score >= 0 and match_score <= 100),
  reasoning jsonb not null default '[]'::jsonb,
  profile_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  severity text not null check (severity in ('info', 'warning', 'critical')),
  ip_hash text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_documents (
  document_id uuid primary key default gen_random_uuid(),
  title text not null,
  document_type text not null,
  source text not null,
  project_name text,
  location text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_chunks (
  chunk_id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.knowledge_documents(document_id) on delete cascade,
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

create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_score_idx on public.leads(lead_score desc);
create index if not exists leads_profile_idx on public.leads using gin(profile);
create index if not exists conversations_session_idx on public.conversations(session_id);
create index if not exists intent_events_session_idx on public.intent_events(session_id);
create index if not exists recommendation_events_session_idx on public.recommendation_events(session_id);
create index if not exists security_events_type_idx on public.security_events(event_type);
create index if not exists knowledge_chunks_embedding_idx on public.knowledge_chunks using ivfflat (embedding vector_cosine_ops);
create index if not exists knowledge_chunks_project_idx on public.knowledge_chunks(project_name);
create index if not exists knowledge_chunks_intent_tags_idx on public.knowledge_chunks using gin(intent_tags);

alter table public.leads enable row level security;
alter table public.conversations enable row level security;
alter table public.intent_events enable row level security;
alter table public.recommendation_events enable row level security;
alter table public.security_events enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;
