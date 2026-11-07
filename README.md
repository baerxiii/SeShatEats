# SeShatEats

A static food diary and recipe tracker built with HTML, CSS, JavaScript, and Supabase.

## Run locally

```sh
python -m http.server 8000
```

Open `http://localhost:8000`. Configure `js/supabase.js` with the project URL and a publishable/anon key only. Never expose a service-role key in browser code.

## Test sign-in and food logging

Open `account.html` or use the sign-in form on the recipe page. Create an account with an email and password, confirm the email if Supabase email confirmation is enabled, then sign in. Supabase Auth persists the session in the browser. Add an item from Food Search and check Today's Diary.

Recipes logged from the recipe builder also appear in the diary for the selected meal and can be removed there. Recipe nutrition is calculated from the recipe's current ingredients and serving count.
The dashboard's recent food and recipe entries can also be removed using their trash buttons.

If adding a food fails, apply these SQL migrations in Supabase SQL Editor in order, if they have not already been run:

1. `supabase/migrations/202611040002_restaurant_food_logs.sql` for restaurant diary references.
2. `supabase/migrations/202611040003_auth_diary_and_catalog_read.sql` for owner-scoped food-log access.
3. `supabase/migrations/202611040004_canada_foods.sql` for Canadian catalog references and read access.

Ensure `food_logs.user_id` exists and your existing RLS policies permit authenticated owners to insert/read/update/delete their own rows. For recipes, Supabase must also grant authenticated users the needed access to `recipes`, `recipe_ingredients`, and `recipe_logs`; those tables' exact ownership columns/policies vary by project.

Run the dashboard and diary regression tests with `node --test tests/*.test.js`.

## Food lookup

Food Search reads `canada_foods` and active `restaurant_foods`. Canadian nutrition is scaled by `weight_g` when provided; restaurant values are treated as per menu serving.

## Security

Food catalogs are intended to be readable by the app. Diary data should be owner-scoped with Row Level Security. Review existing permissive policies because PostgreSQL permissive policies combine with OR. Never expose a service-role key in browser code.
