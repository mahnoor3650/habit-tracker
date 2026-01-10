-- Drop existing daily_metrics table
drop table if exists public.daily_metrics cascade;

-- Create metrics table (similar to habits)
create table if not exists public.metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  unit text,
  icon text,
  color text,
  "order" integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create metric_entries table (similar to habit_entries but with numeric value)
create table if not exists public.metric_entries (
  id uuid primary key default gen_random_uuid(),
  metric_id uuid not null references public.metrics(id) on delete cascade,
  date date not null,
  value numeric(10, 2) not null default 0,
  created_at timestamp with time zone default now(),
  unique (metric_id, date)
);

-- Create indexes for better query performance
create index if not exists idx_metrics_user_order on public.metrics(user_id, "order");
create index if not exists idx_metric_entries_metric_date on public.metric_entries(metric_id, date desc);
create index if not exists idx_metric_entries_date on public.metric_entries(date desc);

-- Trigger to keep updated_at fresh
drop trigger if exists set_metrics_updated_at on public.metrics;
create trigger set_metrics_updated_at
before update on public.metrics
for each row execute function public.set_updated_at();

-- RLS
alter table public.metrics enable row level security;
alter table public.metric_entries enable row level security;

-- Policies for metrics
drop policy if exists "Users can manage their metrics" on public.metrics;
create policy "Users can manage their metrics"
on public.metrics
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Policies for metric_entries via metric ownership
drop policy if exists "Users can manage entries of their metrics" on public.metric_entries;
create policy "Users can manage entries of their metrics"
on public.metric_entries
for all
using (exists (select 1 from public.metrics m where m.id = metric_id and m.user_id = auth.uid()))
with check (exists (select 1 from public.metrics m where m.id = metric_id and m.user_id = auth.uid()));
