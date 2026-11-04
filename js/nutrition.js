/* Shared nutrition helpers. Canadian food rows are stored per their stated serving weight. */
function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function scaledNutrition(food, amount = 1) {
  const factor = Number(amount) || 0;
  return {
    calories: Number(food?.calories || 0) * factor,
    protein: Number(food?.protein_g || 0) * factor,
    carbs: Number(food?.carbs_g || 0) * factor,
    fat: Number(food?.fat_g || 0) * factor
  };
}

/* Canada Foods nutrition is per serving; weight_g is the serving weight when present. */
function nutritionForGrams(food, grams) {
  const weight = Number(grams) || 0;
  const servingWeight = Number(food?.weight_g);
  return scaledNutrition(food, weight / (servingWeight > 0 ? servingWeight : 100));
}

function addNutrition(total, item) {
  total.calories += item.calories;
  total.protein += item.protein;
  total.carbs += item.carbs;
  total.fat += item.fat;
  return total;
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

/* Load recipe totals from Canadian ingredients, without depending on the legacy recipe_totals view. */
async function loadCanadianRecipeTotals(recipeIds) {
  const ids = [...new Set((recipeIds || []).filter(Boolean).map(String))];
  if (!ids.length) return { recipes: new Map(), error: null };

  const { data: recipeRows, error: recipeError } = await supabaseClient
    .from('recipes').select('id,recipe_name,servings').in('id', ids);
  if (recipeError) return { recipes: new Map(), error: recipeError };

  const { data: ingredients, error: ingredientError } = await supabaseClient
    .from('recipe_ingredients').select('id,recipe_id,canada_food_id,food_id,grams').in('recipe_id', ids);
  if (ingredientError) return { recipes: new Map(), error: ingredientError };

  const canadaIds = [...new Set((ingredients || []).map(row => row.canada_food_id).filter(Boolean))];
  let foodById = new Map();
  if (canadaIds.length) {
    const { data: foods, error: foodError } = await supabaseClient
      .from('canada_foods').select('id,item_name,calories,protein_g,carbs_g,fat_g,weight_g,serving_measure').in('id', canadaIds);
    if (foodError) return { recipes: new Map(), error: foodError };
    foodById = new Map((foods || []).map(food => [String(food.id), food]));
  }

  const totals = new Map((recipeRows || []).map(recipe => [String(recipe.id), {
    ...recipe, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, legacyIngredients: 0
  }]));
  (ingredients || []).forEach(ingredient => {
    const total = totals.get(String(ingredient.recipe_id));
    if (!total) return;
    const food = foodById.get(String(ingredient.canada_food_id));
    if (!food) {
      if (ingredient.food_id) total.legacyIngredients += 1;
      return;
    }
    const macros = nutritionForGrams(food, Number(ingredient.grams || 0));
    total.calories += macros.calories;
    total.protein_g += macros.protein;
    total.carbs_g += macros.carbs;
    total.fat_g += macros.fat;
  });
  return { recipes: totals, error: null };
}
