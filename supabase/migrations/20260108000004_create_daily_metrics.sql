-- Create daily_metrics table for tracking numeric metrics like sleep, water, etc.
create table if not exists public.daily_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  metric_type text not null,
  value numeric(10, 2) not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (user_id, date, metric_type)
);

-- Create index for better query performance
create index if not exists idx_daily_metrics_user_date on public.daily_metrics(user_id, date desc);
create index if not exists idx_daily_metrics_date on public.daily_metrics(date desc);

-- Trigger to keep updated_at fresh
drop trigger if exists set_daily_metrics_updated_at on public.daily_metrics;
create trigger set_daily_metrics_updated_at
before update on public.daily_metrics
for each row execute function public.set_updated_at();

-- RLS
alter table public.daily_metrics enable row level security;

-- Policies for daily_metrics
drop policy if exists "Users can manage their daily metrics" on public.daily_metrics;
create policy "Users can manage their daily metrics"
on public.daily_metrics
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
