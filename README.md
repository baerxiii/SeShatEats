# SeShatEats

A static food diary and recipe tracker built with HTML, CSS, JavaScript, and Supabase.

## Run locally

```sh
python -m http.server 8000
```

Configure `js/supabase.js` with the Supabase project URL and publishable/anon key only. Never expose a service-role key in browser code.

## Food lookup and diary

Food Search reads the Canadian `canada_foods` table and the active `restaurant_foods` menu table. Canadian nutrition values are scaled by each row's `weight_g` when present; rows without a positive weight are treated as per 100 g. Restaurant values are per menu serving.

Apply `supabase/migrations/202611040004_canada_foods.sql` in Supabase SQL Editor before adding Canadian foods to diaries or recipes. It adds Canadian food references while preserving old `food_id` rows. The restaurant diary migration `202611040002_restaurant_food_logs.sql` is also required for restaurant logging.

The app no longer queries the old USDA catalog. Legacy log and recipe ingredient rows remain in the database; pages show a legacy placeholder and exclude those rows from recalculated nutrition until they are replaced with Canadian foods. No existing records are deleted.

## Pages

- `index.html`: dashboard and today's entries.
- `search.html`: Canadian and restaurant food search plus diary logging.
- `diary.html`: meal-grouped entries, totals, portion adjustments, and removal.
- `recipes.html`: recipe builder using Canadian foods and serving weights.
- `admin-foods.html`: browse Canadian foods.

## Authentication and security

Supabase email/password sign-up and sign-in use the existing Auth project. Food logs are intended to be owner-scoped by `user_id`; review existing RLS policies because permissive policies combine with OR. Never expose a service-role key in frontend code.
