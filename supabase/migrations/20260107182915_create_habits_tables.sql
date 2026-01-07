-- Tables
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  color text,
  icon text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.habit_entries (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  date date not null,
  completed boolean not null default true,
  created_at timestamp with time zone default now(),
  unique (habit_id, date)
);

-- Triggers to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_habits_updated_at on public.habits;
create trigger set_habits_updated_at
before update on public.habits
for each row execute function public.set_updated_at();

-- RLS
alter table public.habits enable row level security;
alter table public.habit_entries enable row level security;

-- Policies for habits
drop policy if exists "Users can manage their habits" on public.habits;
create policy "Users can manage their habits"
on public.habits
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Policies for habit_entries via habit ownership
drop policy if exists "Users can manage entries of their habits" on public.habit_entries;
create policy "Users can manage entries of their habits"
on public.habit_entries
for all
using (exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid()))
with check (exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid()));

