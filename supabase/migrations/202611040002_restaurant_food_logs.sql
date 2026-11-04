-- Add restaurant entries as a second supported source for food_logs.
-- Existing food_logs continue referencing usda_foods through food_id.
alter table public.food_logs
  alter column food_id drop not null;

alter table public.food_logs
  add column if not exists restaurant_food_id bigint
  references public.restaurant_foods(id) on delete restrict;

alter table public.food_logs
  drop constraint if exists food_logs_exactly_one_food_source;

alter table public.food_logs
  add constraint food_logs_exactly_one_food_source
  check ((food_id is not null) <> (restaurant_food_id is not null));

create index if not exists food_logs_restaurant_food_id_idx
  on public.food_logs (restaurant_food_id)
  where restaurant_food_id is not null;
