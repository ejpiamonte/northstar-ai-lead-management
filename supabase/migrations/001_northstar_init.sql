-- northstar-ai-lead-management\migrations\001_northstar_init.sql
-- =====================================================================
-- Northstar AI Lead Management System
-- Migration 001: schema, indexes, triggers, RLS lockdown, seed reps
-- Run in the Supabase SQL editor or via `supabase db push`.
-- =====================================================================

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Shared trigger: keep updated_at current
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- app_settings: key/value store (holds the Demo Mode toggle)
-- ---------------------------------------------------------------------
create table public.app_settings (
  key         text primary key,
  value       jsonb       not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

create trigger trg_app_settings_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- salespeople
-- ---------------------------------------------------------------------
create table public.salespeople (
  id              uuid        primary key default gen_random_uuid(),
  name            text        not null,
  email           text        not null unique,
  role_title      text        not null,
  specialty       text        not null check (specialty in ('ai_automation', 'web_app', 'support')),
  tier_focus      text        not null check (tier_focus in ('high', 'mid', 'low')),
  max_open_leads  integer     not null default 12 check (max_open_leads > 0),
  calendar_url    text,
  timezone        text        not null default 'UTC',
  active          boolean     not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_salespeople_active_tier on public.salespeople (active, tier_focus);

create trigger trg_salespeople_updated_at
  before update on public.salespeople
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------
create table public.leads (
  id               uuid        primary key default gen_random_uuid(),
  full_name        text        not null,
  email            text        not null,
  company          text,
  phone            text,
  service_interest text,
  budget_range     text,
  timeline         text,
  message          text        not null,
  source           text        not null default 'website_form',
  status           text        not null default 'new'
                   check (status in ('new', 'analyzing', 'assigned', 'contacted',
                                     'qualified', 'appointment_set', 'won', 'lost')),
  tier             text        check (tier in ('high', 'mid', 'low')),
  score            integer     check (score between 0 and 100),
  ai_analysis      jsonb,
  assigned_to      uuid        references public.salespeople (id) on delete set null,
  assigned_at      timestamptz,
  is_demo          boolean     not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_leads_email          on public.leads (lower(email));
create index idx_leads_status         on public.leads (status);
create index idx_leads_tier           on public.leads (tier);
create index idx_leads_assigned_to    on public.leads (assigned_to) where assigned_to is not null;
create index idx_leads_created_at     on public.leads (created_at desc);
create index idx_leads_is_demo        on public.leads (is_demo);
create index idx_leads_ai_analysis    on public.leads using gin (ai_analysis jsonb_path_ops);

create trigger trg_leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- automation_runs: one row per webhook execution, steps stored as jsonb
-- ---------------------------------------------------------------------
create table public.automation_runs (
  id            uuid        primary key default gen_random_uuid(),
  lead_id       uuid        references public.leads (id) on delete cascade,
  trigger       text        not null default 'webhook',
  mode          text        not null default 'demo' check (mode in ('demo', 'live')),
  status        text        not null default 'running'
                check (status in ('running', 'success', 'partial', 'failed')),
  ai_provider   text,
  model         text,
  steps         jsonb       not null default '[]'::jsonb,
  duration_ms   integer,
  error         text,
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,
  created_at    timestamptz not null default now()
);

create index idx_automation_runs_lead_id     on public.automation_runs (lead_id);
create index idx_automation_runs_status_time on public.automation_runs (status, started_at desc);

-- ---------------------------------------------------------------------
-- lead_activities: human-readable timeline per lead
-- ---------------------------------------------------------------------
create table public.lead_activities (
  id                 uuid        primary key default gen_random_uuid(),
  lead_id            uuid        not null references public.leads (id) on delete cascade,
  salesperson_id     uuid        references public.salespeople (id) on delete set null,
  automation_run_id  uuid        references public.automation_runs (id) on delete set null,
  activity_type      text        not null,
  title              text        not null,
  description        text,
  metadata           jsonb       not null default '{}'::jsonb,
  created_at         timestamptz not null default now()
);

create index idx_lead_activities_lead_time on public.lead_activities (lead_id, created_at desc);
create index idx_lead_activities_run       on public.lead_activities (automation_run_id) where automation_run_id is not null;
create index idx_lead_activities_type      on public.lead_activities (activity_type);

-- ---------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------
create table public.appointments (
  id                uuid        primary key default gen_random_uuid(),
  lead_id           uuid        not null references public.leads (id) on delete cascade,
  salesperson_id    uuid        not null references public.salespeople (id) on delete restrict,
  scheduled_at      timestamptz not null,
  duration_minutes  integer     not null default 30 check (duration_minutes between 5 and 480),
  status            text        not null default 'proposed'
                    check (status in ('proposed', 'confirmed', 'completed', 'cancelled', 'no_show')),
  meeting_url       text,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_appointments_lead         on public.appointments (lead_id);
create index idx_appointments_rep_schedule on public.appointments (salesperson_id, scheduled_at);
create index idx_appointments_status_time  on public.appointments (status, scheduled_at);

create trigger trg_appointments_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- email_logs
-- ---------------------------------------------------------------------
create table public.email_logs (
  id                 uuid        primary key default gen_random_uuid(),
  lead_id            uuid        references public.leads (id) on delete cascade,
  salesperson_id     uuid        references public.salespeople (id) on delete set null,
  automation_run_id  uuid        references public.automation_runs (id) on delete set null,
  email_type         text        not null check (email_type in ('lead_acknowledgment', 'rep_notification', 'follow_up')),
  direction          text        not null default 'outbound' check (direction in ('outbound', 'internal')),
  to_email           text        not null,
  from_email         text        not null,
  subject            text        not null,
  body               text        not null,
  status             text        not null default 'queued'
                     check (status in ('queued', 'mocked', 'sent', 'failed')),
  provider           text,
  provider_message_id text,
  is_mock            boolean     not null default true,
  error              text,
  sent_at            timestamptz,
  created_at         timestamptz not null default now()
);

create index idx_email_logs_lead      on public.email_logs (lead_id, created_at desc);
create index idx_email_logs_run       on public.email_logs (automation_run_id) where automation_run_id is not null;
create index idx_email_logs_status    on public.email_logs (status);

-- ---------------------------------------------------------------------
-- Row Level Security: deny all by default.
-- The app talks to Supabase from the server with the service-role key,
-- which bypasses RLS. Add explicit policies before exposing any table
-- to the anon or authenticated roles.
-- ---------------------------------------------------------------------
alter table public.app_settings     enable row level security;
alter table public.salespeople      enable row level security;
alter table public.leads            enable row level security;
alter table public.automation_runs  enable row level security;
alter table public.lead_activities  enable row level security;
alter table public.appointments     enable row level security;
alter table public.email_logs       enable row level security;

-- ---------------------------------------------------------------------
-- Seed: settings and the three fictional salespeople
-- ---------------------------------------------------------------------
insert into public.app_settings (key, value)
values ('demo_mode', '{"enabled": true}'::jsonb)
on conflict (key) do nothing;

insert into public.salespeople
  (id, name, email, role_title, specialty, tier_focus, max_open_leads, calendar_url, timezone)
values
  ('5a000000-0000-4000-8000-000000000001',
   'Sarah Whitfield', 'sarah@northstardigital.example',
   'Principal AI Automation Lead', 'ai_automation', 'high', 8,
   'https://cal.northstardigital.example/sarah', 'America/Los_Angeles'),
  ('5a000000-0000-4000-8000-000000000002',
   'Alex Moreno', 'alex@northstardigital.example',
   'Senior Web App Consultant', 'web_app', 'mid', 12,
   'https://cal.northstardigital.example/alex', 'America/New_York'),
  ('5a000000-0000-4000-8000-000000000003',
   'Maria Santos', 'maria@northstardigital.example',
   'Client Success and Support Lead', 'support', 'low', 20,
   'https://cal.northstardigital.example/maria', 'Europe/London')
on conflict (email) do nothing;

commit;
