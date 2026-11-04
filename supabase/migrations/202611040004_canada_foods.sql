-- Add Canada's food catalogue as a food-log and recipe-ingredient source.
-- Preserve existing legacy food_id values so old log rows are not deleted.
alter table public.food_logs
  add column if not exists canada_food_id bigint references public.canada_foods(id) on delete restrict;

-- Keep legacy food_id rows valid while requiring exactly one source for new/updated rows.
alter table public.food_logs drop constraint if exists food_logs_exactly_one_food_source;
alter table public.food_logs drop constraint if exists food_logs_exactly_one_food_source_v2;
alter table public.food_logs
  add constraint food_logs_exactly_one_food_source_v2
  check (((food_id is not null)::int + (canada_food_id is not null)::int + (restaurant_food_id is not null)::int) = 1);
create index if not exists food_logs_canada_food_id_idx on public.food_logs(canada_food_id) where canada_food_id is not null;

-- Recipe ingredient food_id remains as legacy data; new recipes use canada_food_id.
alter table public.recipe_ingredients
  add column if not exists canada_food_id bigint references public.canada_foods(id) on delete restrict;
create index if not exists recipe_ingredients_canada_food_id_idx on public.recipe_ingredients(canada_food_id) where canada_food_id is not null;

-- Make the Canadian catalogue readable to the app roles. Restaurant policies remain unchanged.
grant select on public.canada_foods to anon, authenticated;
alter table public.canada_foods enable row level security;
drop policy if exists canada_foods_catalog_read on public.canada_foods;
create policy canada_foods_catalog_read on public.canada_foods for select to anon, authenticated using (true);
