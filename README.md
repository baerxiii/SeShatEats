# SeShatEats

A static food diary and recipe tracker built with HTML, CSS, JavaScript, and Supabase.

## Run locally

```sh
python -m http.server 8000
```

Open `http://localhost:8000`. Configure `js/supabase.js` with the project URL and a publishable/anon key only. Never expose a service-role key in browser code.

## Authentication and diary

Food Search supports Supabase email/password sign-up and sign-in using the existing Supabase Auth project. Food logs are inserted with the signed-in user's `user_id`; diary queries are scoped to that user. Apply `supabase/migrations/202611040003_auth_diary_and_catalog_read.sql` in the Supabase SQL Editor to add owner-based food-log policies and read policies for the food catalogs.

If email confirmation is enabled in Supabase Auth, a new account must confirm its email before signing in. Check the Supabase Auth URL configuration so the deployed site URL is an allowed redirect/site URL.

## Food lookup

Food Search looks up friendly names from `curated_foods` joined in the app to `usda_foods`, and searches `restaurant_foods` by both item name and restaurant name. Restaurant foods are served per menu item; curated USDA foods use the food-table values per 100 g. Search displays readable permission errors rather than silently dropping a catalog.

To log restaurant entries, `food_logs.restaurant_food_id` must exist and `food_id` must allow NULL. Apply `supabase/migrations/202611040002_restaurant_food_logs.sql` if that change has not already been made. Each food log must reference exactly one source.

## Pages

- `index.html`: dashboard and today's recent entries.
- `search.html`: curated and restaurant food search plus diary logging.
- `diary.html`: meal-grouped entries, totals, portion adjustments, and removal.
- `recipes.html`: recipe builder using USDA foods as gram-based ingredients.
- `admin-foods.html`: manage curated USDA quick-add foods.

## Security

The food catalog is publicly readable; diary rows are intended to be owner-scoped. Review existing Supabase RLS policies because permissive policies combine with OR and may override the intended restriction. Never expose a service-role key in frontend code.
