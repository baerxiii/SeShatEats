# SeShatEats

A static food diary and recipe tracker built with HTML, CSS, JavaScript, and Supabase.

## Run locally

```sh
python -m http.server 8000
```

Open `http://localhost:8000`. Configure `js/supabase.js` with the project URL and a publishable/anon key only. Never expose a service-role key in browser code.

## Search and log foods

The Food Search page queries `usda_foods` and `restaurant_foods` independently, in parallel, and labels each result. Restaurant items are searched by both menu item name and restaurant name; active records (`active = true`) are displayed. The page displays per-source read errors instead of silently showing only one catalogue.

For restaurant diary logging, apply `supabase/migrations/202611040002_restaurant_food_logs.sql` in the Supabase SQL Editor. It adds `food_logs.restaurant_food_id`, keeps the existing USDA `food_id` foreign key, and enforces that a food log references exactly one source. Restaurant nutrition values are per menu serving; `servings` is the number of menu servings. USDA nutrition fields are per 100 g, and `servings` is the number of 100 g portions.

If restaurant results do not appear, verify `restaurant_foods` is exposed in the Supabase `public` schema and that SELECT is granted to the app's role (usually `anon` or `authenticated`, depending on the session). The UI reports individual query errors. If diary relationship joins are unavailable after the migration, refresh the Supabase PostgREST schema cache.

## Other pages

- `index.html`: today's nutrition and recent entries.
- `diary.html`: meal-grouped food and recipe logs with portion controls.
- `recipes.html`: recipe builder using USDA foods as gram-based ingredients.
- `admin-foods.html`: curate USDA quick-add foods.
- `admin/importer.html`: links to the safe data-management workflows.

## Data and security

The app also expects `curated_foods`, `recipes`, `recipe_ingredients`, `recipe_logs`, and the `recipe_totals` view. Protect private diary data with Supabase Row Level Security and ownership policies.
