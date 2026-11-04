# SeShatEats

A static food diary and recipe tracker built with HTML, CSS, JavaScript, and Supabase.

## Run locally

```sh
python -m http.server 8000
```

Open `http://localhost:8000`. Configure the Supabase project in `js/supabase.js` with a publishable/anon key only (never a service-role key).

## PDF nutrition import

The food search page can extract selectable PDF text in the browser using PDF.js; the PDF is not uploaded. Image-only/scanned PDFs need OCR or manual transcription. Extraction is best-effort: review all suggested values and serving basis against the original before saving. Use only material whose terms allow your intended use; preserve a source URL when available.

Before using PDF/manual imports, apply `supabase/migrations/202611040001_manual_food_provenance_and_serving_basis.sql` in the Supabase SQL Editor. It adds `nutrition_basis`, `serving_size_g`, `source_url`, and `source_checked_at` to `usda_foods`. Existing foods remain per 100 g. New restaurant entries can store macros per serving; the diary scales those values by logged portions. Recipe ingredients are weight-based and require a serving weight for per-serving foods.

## Nutrition data

This app expects `usda_foods`, `food_logs`, `recipes`, `recipe_ingredients`, `recipe_logs`, `curated_foods`, and `recipe_totals`. Nutrition fields on legacy foods are per 100 g. Food and restaurant PDF values are user-entered and should be checked for accuracy and source reuse permissions.

## Security

The browser key is public by design, so enforce Supabase Row Level Security and ownership policies before storing private user diaries. Do not expose a service-role key in the static app.
