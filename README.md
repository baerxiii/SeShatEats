# SeShatEats

A static food diary and recipe tracker built with HTML, CSS, JavaScript, and Supabase.

## Run locally

```sh
python -m http.server 8000
```

Open `http://localhost:8000`. Configure the Supabase project in `js/supabase.js` with a publishable/anon key only (never a service-role key).

## Food lookup

Food Search checks both `usda_foods` and `restaurant_foods` in parallel and labels each result by source. Restaurant rows are expected to contain `active`, `restaurant`, `category`, `item_name`, nutrition fields, `serving_size`, and optional `source_url`.

To let restaurant results be logged to the diary, first run `supabase/migrations/202611040002_restaurant_food_logs.sql` in the Supabase SQL Editor. It adds `food_logs.restaurant_food_id`, keeps the existing USDA `food_id` foreign key, and requires each diary row to reference exactly one food source. Reload the Supabase API schema cache if the new relationship is not immediately visible.

Restaurant nutrition is treated as per menu serving; the `servings` field is the number of restaurant servings logged. USDA values continue to be treated as per 100 g portions.

## Data and security

The app also expects `curated_foods`, `recipes`, `recipe_ingredients`, `recipe_logs`, and the `recipe_totals` view. Enforce Supabase Row Level Security and ownership policies before storing private diary data. Never expose a service-role key in the static app.
