-- Add order field to habits table for drag-and-drop reordering
alter table public.habits add column if not exists "order" integer default 0;

-- Update existing habits to have sequential order based on created_at
update public.habits
set "order" = subquery.row_number - 1
from (
  select id, row_number() over (partition by user_id order by created_at) as row_number
  from public.habits
) as subquery
where public.habits.id = subquery.id;

-- Create index for better performance
create index if not exists idx_habits_user_order on public.habits(user_id, "order");
