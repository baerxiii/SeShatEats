# SeShatEats

A static food diary and recipe tracker built with HTML, CSS, JavaScript, and Supabase.

## Run locally

```sh
python -m http.server 8000
```

Open `http://localhost:8000`. Configure the Supabase project in `js/supabase.js` with a publishable/anon key only (never a service-role key).

## Food data

The app searches foods in `usda_foods` and expects `food_logs`, `recipes`, `recipe_ingredients`, `recipe_logs`, `curated_foods`, and the `recipe_totals` view. Food calories, protein, carbs, and fat are treated as per 100 g; a food log's `servings` value represents 100 g portions. The search page only reads existing foods and adds them to the diary.

## Security

The browser key is public by design. Enforce Supabase Row Level Security and ownership policies before storing private user diaries. Never expose a service-role key in the static app.
