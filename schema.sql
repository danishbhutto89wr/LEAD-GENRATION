-- Lead Automation App — database schema
-- Run this once in Supabase → SQL Editor → Run

create extension if not exists "uuid-ossp";

create table if not exists batches (
  id uuid primary key default uuid_generate_v4(),
  batch_number int not null,
  status text not null default 'pending', -- pending | sending | sent | partial
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default uuid_generate_v4(),
  batch_id uuid references batches(id) on delete cascade,
  email text not null,
  website text not null,
  status text not null default 'pending', -- pending | sending | sent | failed
  tracking_id uuid not null default uuid_generate_v4(),
  subject text,
  email_body text,
  audit_data jsonb,
  error_message text,
  sent_at timestamptz,
  opened_at timestamptz,
  open_count int not null default 0,
  clicked_at timestamptz,
  click_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_leads_batch_id on leads(batch_id);
create index if not exists idx_leads_tracking_id on leads(tracking_id);
