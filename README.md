# SeShatEats

A static food diary and recipe tracker built with HTML, CSS, JavaScript, and Supabase.

## Run locally

```sh
python -m http.server 8000
```

Configure `js/supabase.js` with the Supabase project URL and publishable/anon key only. Never expose a service-role key in browser code.

## Food lookup and diary

Food Search reads the Canadian `canada_foods` table and the active `restaurant_foods` menu table. Canadian nutrition values are scaled by each row's `weight_g` when present; rows without a positive weight are treated as per 100 g. Restaurant values are per menu serving.

Before using Canadian foods in logs and recipes, apply `supabase/migrations/202611040004_canada_foods.sql` in Supabase SQL Editor. It adds `food_logs.canada_food_id`, `recipe_ingredients.canada_food_id`, the catalog read policy, and a source check while preserving existing legacy `food_id` rows. The restaurant diary migration `202611040002_restaurant_food_logs.sql` must also have been applied for restaurant logging.

The app no longer queries `usda_foods` or uses `curated_foods` for food lookup. Existing records that point only to the old `food_id` field are preserved in the database but are not rendered by the new Canada/restaurant diary view; remap them to Canadian entries separately if they need to appear.

## Pages

- `index.html`: dashboard and today's entries.
- `search.html`: Canadian and restaurant food search plus diary logging.
- `diary.html`: meal-grouped entries, nutrition totals, portion adjustments, and removal.
- `recipes.html`: recipe builder using Canadian foods and their serving weights.
- `admin-foods.html`: browse Canadian foods.

## Authentication and security

Supabase email/password sign-up and sign-in use the existing Auth project. Food logs are intended to be owner-scoped by `user_id`; review existing RLS policies because permissive policies combine with OR. Never expose a service-role key in browser code.
