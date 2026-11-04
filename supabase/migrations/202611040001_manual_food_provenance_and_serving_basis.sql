-- Run in Supabase SQL Editor before using the PDF/manual-food importer.
-- Existing rows remain compatible: NULL nutrition_basis is interpreted as per 100 g.
alter table public.usda_foods
  add column if not exists nutrition_basis text not null default 'per_100g'
    check (nutrition_basis in ('per_100g', 'per_serving')),
  add column if not exists serving_size_g numeric,
  add column if not exists source_url text,
  add column if not exists source_checked_at date,
  add column if not exists brand text;

alter table public.usda_foods
  add constraint usda_foods_serving_size_g_positive
  check (serving_size_g is null or serving_size_g > 0) not valid;

alter table public.usda_foods
  validate constraint usda_foods_serving_size_g_positive;
