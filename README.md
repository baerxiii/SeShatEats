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

## Supabase data

The pages expect `usda_foods`, `curated_foods`, `food_logs`, `recipes`, `recipe_ingredients`, `recipe_logs`, and the `recipe_totals` view. Food calories, protein, carbohydrate, and fat values are treated as **per 100 g** throughout the food search, diary, and recipe calculations. Recipe totals are divided by the recipe's serving count when added to a diary.

The repository does not currently include database migrations or row-level security policies. Before using this with multiple people or storing private diary data, enable Supabase Auth, associate each log/recipe with its owner, and enforce ownership with RLS policies. Never expose a service-role credential in this static app.

## Food data

Import foods only from a properly attributed source and map them into `usda_foods` using the columns your Supabase schema actually defines. Review serving basis and units before importing; a per-serving label must not be interpreted as per 100 g. Avoid storing an API secret in browser JavaScript—use a server-side/edge function for third-party APIs that require a secret.
