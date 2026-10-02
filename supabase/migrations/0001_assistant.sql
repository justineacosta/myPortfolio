-- The assistant's conversation log (spec 7.4). Plain Postgres: paste it into the Supabase SQL editor and run it once.
-- Before running, enable pg_cron under Database > Extensions.

create table conversations (
  id uuid primary key,
  started_at timestamptz not null default now(),
  first_page text not null,
  lead_captured boolean not null default false
);

create table messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'tool')),
  content text not null,
  tool_name text,
  tool_input jsonb,
  input_tokens int,
  output_tokens int,
  created_at timestamptz not null default now()
);

create index on messages (conversation_id, created_at);

-- Row Level Security on, no policies: only the service role key (server only) can read or write.
alter table conversations enable row level security;
alter table messages enable row level security;

-- Retention: every day at 03:15 delete conversations older than 90 days (their messages go by cascade).
create extension if not exists pg_cron;
select cron.schedule('assistant-retention', '15 3 * * *', $$delete from conversations where started_at < now() - interval '90 days'$$);
