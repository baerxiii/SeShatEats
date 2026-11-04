-- Authenticated personal food diaries and publicly readable food catalogs.
-- Review any pre-existing permissive RLS policies before deployment; permissive policies combine with OR.
alter table public.food_logs enable row level security;
grant select, insert, update, delete on public.food_logs to authenticated;

drop policy if exists food_logs_owner_select on public.food_logs;
create policy food_logs_owner_select on public.food_logs
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists food_logs_owner_insert on public.food_logs;
create policy food_logs_owner_insert on public.food_logs
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists food_logs_owner_update on public.food_logs;
create policy food_logs_owner_update on public.food_logs
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists food_logs_owner_delete on public.food_logs;
create policy food_logs_owner_delete on public.food_logs
  for delete to authenticated using (auth.uid() = user_id);

-- Searchable food catalogs can be read by signed-in and anonymous visitors.
grant select on public.usda_foods, public.curated_foods, public.restaurant_foods to anon, authenticated;
alter table public.usda_foods enable row level security;
alter table public.curated_foods enable row level security;
alter table public.restaurant_foods enable row level security;
drop policy if exists usda_foods_catalog_read on public.usda_foods;
create policy usda_foods_catalog_read on public.usda_foods for select to anon, authenticated using (true);
drop policy if exists curated_foods_catalog_read on public.curated_foods;
create policy curated_foods_catalog_read on public.curated_foods for select to anon, authenticated using (true);
drop policy if exists restaurant_foods_catalog_read on public.restaurant_foods;
create policy restaurant_foods_catalog_read on public.restaurant_foods for select to anon, authenticated using (active = true);
