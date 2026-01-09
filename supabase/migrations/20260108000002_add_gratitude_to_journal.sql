-- Add gratitude column to journal_entries table
alter table public.journal_entries add column if not exists gratitude text[] default '{}';
