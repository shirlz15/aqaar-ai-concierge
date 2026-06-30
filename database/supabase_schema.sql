-- Aqaar AI Concierge Supabase schema
-- Run this in the Supabase SQL editor for the production project.

create extension if not exists pgcrypto;

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  memory jsonb not null default '{}'::jsonb,
  intent text,
  lead_name text,
  lead_phone text,
  lead_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references public.chat_sessions(session_id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  session_id text references public.chat_sessions(session_id) on delete set null,
  name text,
  phone text,
  email text,
  intent text,
  budget text,
  location text,
  project text,
  timeline text,
  source text not null default 'aqaar_ai_concierge',
  status text not null default 'new',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_properties (
  id uuid primary key default gen_random_uuid(),
  session_id text references public.chat_sessions(session_id) on delete cascade,
  project_name text not null,
  property_id text,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.dashboard_events (
  id uuid primary key default gen_random_uuid(),
  session_id text references public.chat_sessions(session_id) on delete set null,
  event_type text not null,
  intent text,
  project_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists chat_sessions_session_id_idx on public.chat_sessions(session_id);
create index if not exists chat_messages_session_id_idx on public.chat_messages(session_id);
create index if not exists leads_session_id_idx on public.leads(session_id);
create index if not exists saved_properties_session_id_idx on public.saved_properties(session_id);
create index if not exists dashboard_events_created_at_idx on public.dashboard_events(created_at desc);

alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.leads enable row level security;
alter table public.saved_properties enable row level security;
alter table public.dashboard_events enable row level security;

create policy "anon_insert_chat_sessions" on public.chat_sessions for insert to anon with check (true);
create policy "anon_upsert_chat_sessions" on public.chat_sessions for update to anon using (true) with check (true);
create policy "anon_insert_chat_messages" on public.chat_messages for insert to anon with check (true);
create policy "anon_insert_leads" on public.leads for insert to anon with check (true);
create policy "anon_insert_saved_properties" on public.saved_properties for insert to anon with check (true);
create policy "anon_insert_dashboard_events" on public.dashboard_events for insert to anon with check (true);

create policy "anon_read_leads_for_dashboard" on public.leads for select to anon using (true);
create policy "anon_read_dashboard_events" on public.dashboard_events for select to anon using (true);
