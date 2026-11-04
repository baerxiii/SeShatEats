# SeShatEats

A lightweight food diary and recipe tracker built with static HTML, CSS, JavaScript, and Supabase.

## Pages

- `index.html` — today's nutrition totals and curated quick-add foods.
- `search.html` — search the food catalog and log a weighed portion.
- `diary.html` — daily meals, food logs, recipe logs, and serving adjustments.
- `recipes.html` — create recipes from foods in the catalog and log servings.
- `admin-foods.html` — curate foods into quick-add categories.

## Run locally

The site is static. Serve the repository root with any local HTTP server (opening files directly can block browser requests):

```sh
python -m http.server 8000
```

Then open `http://localhost:8000`. The app uses the Supabase project configured in `js/supabase.js`; the browser key must be a publishable/anon key, never a service-role key.

## Supabase auth + user data safety

Enable Supabase Auth in the project dashboard and add a simple sign-in flow before using diary entries for real personal data. The app now includes a small `js/auth.js` helper and a visible auth status block in the main pages. This is a scaffold for authentication, but the data itself still needs database-level protections.

Use this pattern in Supabase SQL to isolate each user's own logs and recipes:

```sql
alter table public.food_logs enable row level security;
alter table public.recipe_logs enable row level security;
alter table public.recipes enable row level security;

create policy "Users can view own food logs" on public.food_logs
for select using (auth.uid() = user_id);

create policy "Users can insert own food logs" on public.food_logs
for insert with check (auth.uid() = user_id);

create policy "Users can update own food logs" on public.food_logs
for update using (auth.uid() = user_id);

create policy "Users can delete own food logs" on public.food_logs
for delete using (auth.uid() = user_id);

create policy "Users can view own recipes" on public.recipes
for select using (auth.uid() = user_id);

create policy "Users can insert own recipes" on public.recipes
for insert with check (auth.uid() = user_id);

create policy "Users can update own recipes" on public.recipes
for update using (auth.uid() = user_id);

create policy "Users can delete own recipes" on public.recipes
for delete using (auth.uid() = user_id);
```

If your schema does not yet have a `user_id` column, add it before turning on RLS. Your browser app should never include a service-role secret. That key is meant for server-side code only.

## Supabase data

The pages expect `usda_foods`, `curated_foods`, `food_logs`, `recipes`, `recipe_ingredients`, `recipe_logs`, and the `recipe_totals` view. Food calories, protein, carbohydrate, and fat values are treated as per 100 g throughout the food search, diary, and recipe calculations. Recipe totals are divided by the recipe's serving count when added to a diary.

## Food data

Import foods only from a properly attributed source and map them into `usda_foods` using the columns your Supabase schema actually defines. Review serving basis and units before importing; a per-serving label must not be interpreted as per 100 g. Avoid storing an API secret in browser JavaScript—use a server-side or edge function for third-party APIs that require a secret.

## Seeded common foods

The repo now includes a starter list in `js/common-foods.js` with common foods and macros for quick search suggestions. Use it as a baseline for your curated food catalog, then import the names you want to keep into `curated_foods` or `usda_foods`.
