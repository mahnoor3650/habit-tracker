-- Add category field to habits table for filtering
alter table public.habits add column if not exists category text;

-- Create index for better query performance when filtering by category
create index if not exists idx_habits_user_category on public.habits(user_id, category);
