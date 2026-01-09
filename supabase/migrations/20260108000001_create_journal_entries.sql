-- Create journal_entries table
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  moods text[] default '{}',
  highlight text,
  quote text,
  content text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (user_id, date)
);

-- Create index for better query performance
create index if not exists idx_journal_entries_user_date on public.journal_entries(user_id, date desc);
create index if not exists idx_journal_entries_date on public.journal_entries(date desc);

-- Trigger to keep updated_at fresh
drop trigger if exists set_journal_entries_updated_at on public.journal_entries;
create trigger set_journal_entries_updated_at
before update on public.journal_entries
for each row execute function public.set_updated_at();

-- RLS
alter table public.journal_entries enable row level security;

-- Policies for journal_entries
drop policy if exists "Users can manage their journal entries" on public.journal_entries;
create policy "Users can manage their journal entries"
on public.journal_entries
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
